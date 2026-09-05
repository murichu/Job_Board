import mongoose from 'mongoose';

const { Schema } = mongoose;

const HistorySchema = new Schema({
  status: { type: String, required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String },
  at: { type: Date, default: Date.now }
}, { _id: false });

const ApplicationSchema = new Schema({
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  employer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // owner of the job
  status: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'],
    default: 'applied'
  },
  resumeUrl: { type: String }, // optional link to uploaded resume
  coverLetter: { type: String },
  history: { type: [HistorySchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ApplicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
