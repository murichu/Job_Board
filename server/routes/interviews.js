import express from 'express';
import Joi from 'joi';
import { protectUser } from '../middleware/userAuth.js';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { emailQueue } from '../queues/emailQueue.js';
import { getIO } from '../socket.js';
import { Queue } from 'bullmq';
import connection from '../utils/redis.js';

const router = express.Router();
const interviewOpsQueue = new Queue('interview-ops', { connection });

const proposeSchema = Joi.object({
  applicationId: Joi.string().required(),
  proposedSlots: Joi.array().items(Joi.object({
    start: Joi.date().required(),
    end: Joi.date().required()
  })).min(1).required(),
  note: Joi.string().max(1000).optional()
});

const acceptSchema = Joi.object({
  interviewId: Joi.string().required(),
  slotIndex: Joi.number().integer().min(0).required()
});

// Recruiter proposes interview slots
router.post('/interviews/propose', protectUser, async (req,res,next) => {
  try {
    const { error, value } = proposeSchema.validate(req.body);
    if (error) return res.status(400).json({ success:false, message:error.message });

    const app = await JobApplication.findById(value.applicationId);
    if (!app) return res.status(404).json({ success:false, message:'Application not found' });

    // Authorization: recruiter must belong to companyId (tenant)
    if (!req.user.tenantId || req.user.tenantId.toString() !== app.companyId.toString()) {
      return res.status(403).json({ success:false, message:'Forbidden' });
    }

    const interview = new Interview({
      jobId: app.jobId,
      applicationId: app._id,
      recruiterId: req.userId,
      candidateId: app.userId,
      proposedSlots: value.proposedSlots,
      timeline: [{ event:'proposed', note:value.note||'', by:req.userId }]
    });

    await interview.save();

    // notify candidate via emailQueue + socket
    try {
      const candidate = await User.findById(app.userId).select('email name');
      const job = await Job.findById(app.jobId).select('title');
      if (candidate && candidate.email) {
        const subject = `Interview proposed for ${job.title}`;
        const html = `<p>A recruiter proposed interview slots for "${job.title}". Please review and choose a slot: ${process.env.CLIENT_URL || ''}/interviews/${interview._id}</p>`;
        await emailQueue.add('send-email', { to: candidate.email, subject, html });
      }
    } catch (e) {
      console.error('Failed to enqueue application notification', e);
    }

    try { const io = getIO(); io.to(`user:${app.userId}`).emit('interview:proposed', { interviewId: interview._id }); } catch (e) {}

    return res.status(201).json({ success:true, interview });
  } catch (err) { next(err); }
});

// Candidate accepts a slot
router.post('/interviews/accept', protectUser, async (req,res,next) => {
  try {
    const { error, value } = acceptSchema.validate(req.body); if (error) return res.status(400).json({ success:false, message:error.message });

    const interview = await Interview.findById(value.interviewId);
    if (!interview) return res.status(404).json({ success:false, message:'Interview not found' });

    if (interview.candidateId.toString() !== req.userId.toString()) return res.status(403).json({ success:false, message:'Only candidate can accept' });

    const slot = interview.proposedSlots[value.slotIndex];
    if (!slot) return res.status(400).json({ success:false, message:'Invalid slot' });

    // Book the slot
    interview.bookedSlot = { start: slot.start, end: slot.end };
    interview.status = 'booked';
    interview.timeline.push({ event:'booked', note:'Candidate accepted', by:req.userId });
    await interview.save();

    // Create calendar event via background job
    try {
      await interviewOpsQueue.add('create-calendar-event', { interviewId: interview._id.toString() }, { removeOnComplete: true, attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
    } catch (e) {
      console.error('Failed to enqueue interview ops job', e);
    }

    // Send notification email to recruiter
    try {
      const recruiter = await User.findById(interview.recruiterId).select('email name');
      const job = await Job.findById(interview.jobId).select('title');
      if (recruiter && recruiter.email) {
        const subject = `Interview booked for ${job.title}`;
        const html = `<p>Candidate accepted an interview slot: ${new Date(slot.start).toLocaleString()} - ${new Date(slot.end).toLocaleString()}</p>`;
        await emailQueue.add('send-email', { to: recruiter.email, subject, html });
      }
    } catch (e) {
      console.error('Failed to enqueue status update email', e);
    }

    try { const io = getIO(); io.to(`user:${interview.recruiterId.toString()}`).emit('interview:booked', { interviewId: interview._id }); } catch (e) {}

    return res.json({ success:true, interview });
  } catch (err) { next(err); }
});

// GET /api/interviews/:id
router.get('/interviews/:id', protectUser, async (req,res,next) => {
  try {
    const interview = await Interview.findById(req.params.id).populate('jobId applicationId recruiterId candidateId').lean();
    if (!interview) return res.status(404).json({ success:false, message:'Not found' });
    // Only participants or admins can view
    const isParticipant = [interview.recruiterId._id.toString(), interview.candidateId._id.toString()].includes(req.userId.toString());
    const isAdmin = req.user.role && req.user.role === 'admin';
    if (!isParticipant && !isAdmin) return res.status(403).json({ success:false, message:'Forbidden' });
    res.json({ success:true, interview });
  } catch (err) { next(err); }
});

export default router;
