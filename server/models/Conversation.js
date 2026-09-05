import mongoose from 'mongoose';

const { Schema } = mongoose;

const ConversationSchema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

ConversationSchema.index({ participants: 1 });

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
