import SavedSearch from '../models/SavedSearch.js';
import { Queue } from 'bullmq';
import { getQueueConnection } from '../lib/redis.js';

// This scheduler enqueues saved-search run jobs for saved searches whose lastRunAt
// exceeds their configured frequency. Run this as a separate process (cron or pm2).

const POLL_INTERVAL_MS = Number(process.env.SAVED_SEARCH_SCHEDULER_INTERVAL_MS) || 1000 * 60 * 60; // default: 1 hour
const connection = getQueueConnection();
const savedSearchQueue = new Queue('saved-searches', { connection });

async function enqueueDueSavedSearches() {
  try {
    const now = new Date();
    const savedSearches = await SavedSearch.find({});

    for (const s of savedSearches) {
      try {
        const last = s.lastRunAt || new Date(0);
        let due = false;
        if (s.frequency === 'immediate') continue; // immediate jobs are enqueued at creation
        if (s.frequency === 'daily') {
          const diff = now - last;
          if (diff >= 1000 * 60 * 60 * 24) due = true;
        }
        if (s.frequency === 'weekly') {
          const diff = now - last;
          if (diff >= 1000 * 60 * 60 * 24 * 7) due = true;
        }

        if (due) {
          await savedSearchQueue.add('run-search', { savedSearchId: s._id.toString() }, { removeOnComplete: true, removeOnFail: true });
          // Do not update lastRunAt here — worker will set it after processing to avoid race conditions
        }
      } catch (err) {
        console.error('Error checking saved search', s._id, err);
      }
    }
  } catch (err) {
    console.error('Saved search scheduler failed', err);
  }
}

async function start() {
  console.log('Saved search scheduler started. Poll interval (ms):', POLL_INTERVAL_MS);
  await enqueueDueSavedSearches();
  setInterval(enqueueDueSavedSearches, POLL_INTERVAL_MS);
}

start().catch(err => {
  console.error('Scheduler crashed', err);
  process.exit(1);
});
