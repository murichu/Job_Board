import mongoose from 'mongoose';

const { Schema } = mongoose;

const SavedSearchSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  keywords: { type: [String], default: [] },
  location: { type: String },
  skills: { type: [String], default: [] },
  frequency: { type: String, enum: ['immediate','daily','weekly'], default: 'daily' },
  lastRunAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.SavedSearch || mongoose.model('SavedSearch', SavedSearchSchema);
