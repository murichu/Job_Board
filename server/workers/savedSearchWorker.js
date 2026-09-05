import { Worker } from 'bullmq';
import connectDB from '../config/mongoDB.js';
import SavedSearch from '../models/SavedSearch.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import connection from '../utils/redis.js';
import { emailQueue } from '../queues/emailQueue.js';

await connectDB();

// Simple matching function: keywords in title/description, location match, skills overlap
function jobMatches(job, saved) {
  const title = (job.title || '').toLowerCase();
  const desc = (job.description || '').toLowerCase();

  if (saved.keywords && saved.keywords.length) {
    const anyKeyword = saved.keywords.some(k => title.includes(k.toLowerCase()) || desc.includes(k.toLowerCase()));
    if (!anyKeyword) return false;
  }

  if (saved.location) {
    if (!job.location) return false;
    if (!job.location.toLowerCase().includes(saved.location.toLowerCase())) return false;
  }

  if (saved.skills && saved.skills.length) {
    const jobSkills = (job.skills || []).map(s => s.toLowerCase());
    const matched = saved.skills.some(s => jobSkills.includes(s.toLowerCase()));
    if (!matched) return false;
  }

  return true;
}

const worker = new Worker('saved-searches', async job => {
  if (job.name !== 'run-search') return;
  const { savedSearchId } = job.data;
  const saved = await SavedSearch.findById(savedSearchId);
  if (!saved) return;

  const recentJobs = await Job.find({ createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) } }).limit(200);
  const matches = recentJobs.filter(j => jobMatches(j, saved));
  if (matches.length === 0) {
    saved.lastRunAt = new Date();
    await saved.save();
    return;
  }

  const user = await User.findById(saved.user);
  if (!user) return;

  // Build email content and enqueue via existing email queue
  const jobLines = matches.map(m => `- ${m.title} (${m.location || 'Remote'}) - ${process.env.APP_URL || ''}/jobs/${m._id}`).join('\n');
  const subject = `Job Alert: ${matches.length} new matches for "${saved.name}"`;
  const text = `Hi ${user.name || user.email},\n\nWe found ${matches.length} new job(s) matching your saved search "${saved.name}":\n\n${jobLines}\n\nTo manage your saved searches, visit ${process.env.APP_URL || ''}/saved-searches`;
  const html = `<p>Hi ${user.name || user.email},</p><p>We found ${matches.length} new job(s) matching your saved search "${saved.name}":</p><pre>${jobLines}</pre><p>To manage your saved searches, visit ${process.env.APP_URL || ''}/saved-searches</p>`;

  try {
    await emailQueue.add('send-email', { to: user.email, subject, html });
  } catch (err) {
    console.error('Failed to enqueue saved-search alert', err);
  }

  saved.lastRunAt = new Date();
  await saved.save();
}, { connection });

worker.on('failed', (job, err) => {
  console.error('SavedSearch worker failed', job.id, err);
});

export default worker;
