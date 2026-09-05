import { Worker } from 'bullmq';
import Application from '../models/Application.js';
import User from '../models/User.js';
import { getQueueConnection } from '../lib/redis.js';
import { sendEmail } from '../lib/email.js';

const connection = getQueueConnection();

const worker = new Worker('application-notifications', async job => {
  const data = job.data;
  if (job.name === 'status-change' || data.type === 'status.update' || data.type === 'application.created') {
    const application = await Application.findById(data.applicationId).populate('job candidate employer');
    if (!application) return;

    // Build email to recipient(s)
    let toUser;
    let subject;
    let text;
    if (data.type === 'application.created') {
      toUser = application.employer;
      subject = `New application for ${application.job.title}`;
      text = `A new candidate applied to ${application.job.title}. Candidate: ${application.candidate.name || application.candidate.email}.`;
    } else {
      toUser = application.candidate;
      subject = `Your application status updated: ${application.job.title}`;
      text = `Your application for "${application.job.title}" is now "${application.status}". Note: ${data.note || ''}`;
    }

    try {
      await sendEmail({ to: toUser.email, subject, text, templateData: { application, data } });
    } catch (err) {
      console.error('Failed to send application notification', err);
    }

    // Optionally emit via Socket.IO if available
    try {
      // attempt dynamic import of socket helper if present
      let io;
      try {
        const sock = await import('../lib/socket.js');
        if (sock && typeof sock.ioInstance === 'function') io = sock.ioInstance();
      } catch (e) {
        // socket helper not present; ignore
      }

      const toUserId = (toUser && toUser._id) ? toUser._id.toString() : null;
      if (io && toUserId) {
        io.to(`user:${toUserId}`).emit('notification', {
          type: data.type,
          applicationId: application._id,
          status: application.status,
          jobId: application.job._id
        });
      }
    } catch (e) {
      // ignore socket errors
    }
  }
}, { connection });

worker.on('failed', (job, err) => {
  console.error('Notification worker failed job', job.id, err);
});

export default worker;
