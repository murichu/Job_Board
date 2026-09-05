import express from 'express';
import Joi from 'joi';
import { protectUser } from '../middleware/userAuth.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { emailQueue } from '../queues/emailQueue.js';
import { getIO } from '../socket.js';

const router = express.Router();

const createConvSchema = Joi.object({
  participantId: Joi.string().required()
});

const sendMessageSchema = Joi.object({
  text: Joi.string().max(4000).allow('', null),
  attachments: Joi.array().items(Joi.string().uri()).optional()
});

// Create or return existing conversation between current user and participant
router.post('/conversations', protectUser, async (req, res, next) => {
  try {
    const { error, value } = createConvSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const participantId = value.participantId;
    if (participantId === req.userId.toString()) return res.status(400).json({ success: false, message: 'Cannot create conversation with self' });

    // Ensure participant exists
    const participant = await User.findById(participantId).select('name email');
    if (!participant) return res.status(404).json({ success: false, message: 'Participant not found' });

    // Find existing conversation with exactly these two participants
    const existing = await Conversation.findOne({ participants: { $all: [req.userId, participantId], $size: 2 } });
    if (existing) return res.json({ success: true, conversation: existing });

    const conv = new Conversation({ participants: [req.userId, participantId] });
    await conv.save();

    return res.status(201).json({ success: true, conversation: conv });
  } catch (err) {
    next(err);
  }
});

// List conversations for current user
router.get('/conversations', protectUser, async (req, res, next) => {
  try {
    const convs = await Conversation.find({ participants: req.userId }).sort({ lastMessageAt: -1 }).limit(100).lean();
    res.json({ success: true, conversations: convs });
  } catch (err) {
    next(err);
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', protectUser, async (req, res, next) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!conv.participants.map(p => p.toString()).includes(req.userId.toString())) return res.status(403).json({ success: false, message: 'Forbidden' });

    const messages = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 }).limit(1000).lean();

    // Mark unread messages as read for this user
    await Message.updateMany({ conversationId: conv._id, readBy: { $ne: req.userId } }, { $addToSet: { readBy: req.userId } });

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
});

// Send a message in a conversation
router.post('/conversations/:id/messages', protectUser, async (req, res, next) => {
  try {
    const { error, value } = sendMessageSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ success: false, message: 'Conversation not found' });
    if (!conv.participants.map(p => p.toString()).includes(req.userId.toString())) return res.status(403).json({ success: false, message: 'Forbidden' });

    const msg = new Message({
      conversationId: conv._id,
      sender: req.userId,
      text: value.text || '',
      attachments: value.attachments || [],
      readBy: [req.userId]
    });
    await msg.save();

    // Update conversation last message
    conv.lastMessage = value.text ? value.text.substring(0, 500) : '';
    conv.lastMessageAt = new Date();
    await conv.save();

    // Emit socket event to all participants
    try {
      const io = getIO();
      for (const p of conv.participants) {
        const pid = p.toString();
        io.to(`user:${pid}`).emit('message:received', { conversationId: conv._id, message: msg });
      }
    } catch (e) {
      // Socket might not be initialized in some environments; ignore
    }

    // Enqueue email notification for participants who are not the sender
    try {
      const otherParticipantIds = conv.participants.map(p => p.toString()).filter(id => id !== req.userId.toString());
      const users = await User.find({ _id: { $in: otherParticipantIds } }).select('email name');
      for (const u of users) {
        const subject = `New message from ${req.user.name || 'Candidate'}`;
        const html = `<p>You have a new message on Job Portal:</p><p>${value.text || '<i>attachment</i>'}</p><p><a href="${process.env.CLIENT_URL || ''}/messages">View message</a></p>`;
        await emailQueue.add('send-email', { to: u.email, subject, html });
      }
    } catch (e) {
      console.error('Failed to enqueue message notification emails', e);
    }

    return res.status(201).json({ success: true, message: msg });
  } catch (err) {
    next(err);
  }
});

export default router;
