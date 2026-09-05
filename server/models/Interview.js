import mongoose from 'mongoose';

const { Schema } = mongoose;

const InterviewSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  applicationId: { type: Schema.Types.ObjectId, ref: 'JobApplication', required: true, index: true },
  recruiterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proposedSlots: [{
    start: { type: Date, required: true },
    end: { type: Date, required: true }
  }],
  bookedSlot: {
    start: { type: Date },
    end: { type: Date }
  },
  status: { type: String, enum: ['proposed','booked','cancelled','completed'], default: 'proposed', index: true },
  calendar: {
    provider: { type: String }, // 'google' | 'outlook'
    providerEventId: { type: String },
    meetLink: { type: String }
  },
  timeline: [{
    event: { type: String },
    note: { type: String },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

InterviewSchema.pre('save', function(next){ this.updatedAt = Date.now(); next(); });

export default mongoose.models.Interview || mongoose.model('Interview', InterviewSchema);
