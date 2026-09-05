import mongoose from 'mongoose';

const { Schema } = mongoose;

const CalendarAuthSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  provider: { type: String, enum: ['google','microsoft'], default: 'google' },
  encryptedRefreshToken: { type: String, required: true },
  scope: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CalendarAuthSchema.pre('save', function(next){ this.updatedAt = Date.now(); next(); });

export default mongoose.models.CalendarAuth || mongoose.model('CalendarAuth', CalendarAuthSchema);
