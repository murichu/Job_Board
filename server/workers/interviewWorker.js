import { Worker, Queue } from 'bullmq';
import connectDB from '../config/mongoDB.js';
import connection from '../utils/redis.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { createGoogleCalendarEvent } from '../lib/calendar/google.js';
import { emailQueue } from '../queues/emailQueue.js';

await connectDB();

const connectionOpts = { connection: connection };

const worker = new Worker('interview-ops', async job => {
  const data = job.data;
  if (data.type === 'create-calendar-event') {
    const { interviewId } = data;
    const interview = await Interview.findById(interviewId);
    if (!interview) return;
    const recruiter = await User.findById(interview.recruiterId);
    const candidate = await User.findById(interview.candidateId);

    try {
      const event = await createGoogleCalendarEvent(interview, recruiter);
      interview.calendar = interview.calendar || {};
      interview.calendar.provider = 'google';
      interview.calendar.providerEventId = event.id;
      interview.calendar.meetLink = event.hangoutLink || event.htmlLink || '';
      await interview.save();

      // Notify participants via email about calendar event / meet link
      const subject = `Interview scheduled: ${interview.jobId}`;
      const html = `<p>Your interview has been booked: ${new Date(interview.bookedSlot.start).toLocaleString()} - ${new Date(interview.bookedSlot.end).toLocaleString()}</p><p>Meeting link: ${interview.calendar.meetLink}</p>`;
      if (recruiter && recruiter.email) await emailQueue.add('send-email', { to: recruiter.email, subject, html });
      if (candidate && candidate.email) await emailQueue.add('send-email', { to: candidate.email, subject, html });

      // Schedule reminders: 24h and 1h before
      const remindersQueue = new Queue('interview-reminders', { connection: connection });
      const startsAt = new Date(interview.bookedSlot.start).getTime();
      const now = Date.now();
      const reminder24 = startsAt - 24*60*60*1000 - now;
      const reminder1 = startsAt - 60*60*1000 - now;
      if (reminder24 > 0) await remindersQueue.add('remind', { interviewId }, { delay: reminder24, removeOnComplete: true });
      if (reminder1 > 0) await remindersQueue.add('remind', { interviewId }, { delay: reminder1, removeOnComplete: true });
    } catch (err) {
      console.error('Failed to create calendar event', err);
      throw err;
    }
  }
}, connectionOpts);

worker.on('failed', (job, err) => console.error('Interview worker failed', job.id, err));

// Reminder worker
const reminderWorker = new Worker('interview-reminders', async job => {
  if (job.name === 'remind' || job.name === 'remind') {
    const { interviewId } = job.data;
    const interview = await Interview.findById(interviewId);
    if (!interview) return;
    const recruiter = await User.findById(interview.recruiterId);
    const candidate = await User.findById(interview.candidateId);
    const subject = `Reminder: Interview for ${interview.jobId}`;
    const html = `<p>Reminder: your interview is scheduled at ${new Date(interview.bookedSlot.start).toLocaleString()}</p><p>Link: ${interview.calendar?.meetLink || ''}</p>`;
    if (recruiter && recruiter.email) await emailQueue.add('send-email', { to: recruiter.email, subject, html });
    if (candidate && candidate.email) await emailQueue.add('send-email', { to: candidate.email, subject, html });
  }
}, { connection: connection });

reminderWorker.on('failed', (job, err) => console.error('Reminder worker failed', job.id, err));

export default worker;
