import express from 'express';
import Joi from 'joi';
import Job from '../models/Job.js';
import JobApplication from '../models/JobApplication.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { protectUser } from '../middleware/userAuth.js';
import { Queue } from 'bullmq';
import connection from '../utils/redis.js';
import { emailQueue } from '../queues/emailQueue.js';

const router = express.Router();

// Business transitions for JobApplication.stage
const ALLOWED_TRANSITIONS = {
  Applied: ['Longlisted', 'Shortlisted', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
  Longlisted: ['Shortlisted', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
  Shortlisted: ['Screening', 'Interview', 'Offer', 'Hired', 'Rejected'],
  Screening: ['Interview', 'Offer', 'Hired', 'Rejected'],
  Interview: ['Offer', 'Hired', 'Rejected'],
  Offer: ['Hired', 'Rejected'],
  Hired: [],
  Rejected: []
};

const applySchema = Joi.object({
  resumeUrl: Joi.string().uri().optional(),
  coverLetter: Joi.string().max(2000).optional()
});

const statusSchema = Joi.object({
  newStage: Joi.string().valid('Applied','Longlisted','Shortlisted','Screening','Interview','Offer','Hired','Rejected').required(),
  note: Joi.string().max(1000).optional()
});

// POST /api/jobs/:jobId/apply
router.post('/jobs/:jobId/apply', protectUser, async (req, res, next) => {
  try {
    const { error, value } = applySchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const { jobId } = req.params;
    const job = await Job.findById(jobId).populate('companyId');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    // prevent duplicate application
    const existing = await JobApplication.findOne({ jobId: job._id, userId: req.userId });
    if (existing) return res.status(409).json({ success: false, message: 'You have already applied to this job' });

    const app = new JobApplication({
      userId: req.userId,
      companyId: job.companyId._id || job.companyId,
      jobId: job._id,
      status: 'Pending',
      stage: 'Applied',
      timeline: [
        {
          stage: 'Applied',
          status: 'Pending',
          note: 'Initial application',
          changedAt: new Date(),
          changedBy: req.user.name || req.user.email || 'Candidate'
        }
      ]
    });

    await app.save();

    // enqueue email to company/recruiter using existing email queue
    try {
      const company = job.companyId;
      const to = company.email;
      const subject = `New application for ${job.title}`;
      const html = `<p>A new candidate applied to <strong>${job.title}</strong>.</p><p>Candidate: ${req.user.name || req.user.email}</p><p>View in dashboard</p>`;
      await emailQueue.add('send-email', { to, subject, html });
    } catch (e) {
      console.error('Failed to enqueue application notification', e);
    }

    return res.status(201).json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status
router.patch('/applications/:id/status', protectUser, async (req, res, next) => {
  try {
    const { error, value } = statusSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const app = await JobApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    const { newStage, note } = value;
    const current = app.stage;

    // Authorization: recruiter/HR of the company (tenant) can change; candidate can withdraw by requesting 'Rejected'
    const isCompanyMember = req.user.tenantId && app.companyId && req.user.tenantId.toString() === app.companyId.toString();
    const isCandidate = req.userId && app.userId && req.userId.toString() === app.userId.toString();

    if (isCandidate && newStage !== 'Rejected') {
      return res.status(403).json({ success: false, message: 'Candidates can only withdraw (set Rejected) their applications' });
    }
    if (!isCompanyMember && !isCandidate) {
      return res.status(403).json({ success: false, message: 'Not authorized to change application stage' });
    }

    const allowed = ALLOWED_TRANSITIONS[current] || [];
    if (!allowed.includes(newStage)) {
      return res.status(400).json({ success: false, message: `Cannot transition from ${current} to ${newStage}` });
    }

    // Map stage to status (coarse-grain status field)
    const stageToStatus = (stage) => {
      if (stage === 'Applied') return 'Pending';
      if (stage === 'Longlisted') return 'Longlisted';
      if (stage === 'Shortlisted') return 'Shortlisted';
      if (stage === 'Rejected') return 'Rejected';
      // For screening/interview/offer/hired keep existing status or set to Shortlisted
      return 'Shortlisted';
    };

    const newStatus = stageToStatus(newStage);

    app.timeline.push({
      stage: newStage,
      status: newStatus,
      note: note || '',
      changedAt: new Date(),
      changedBy: req.user.name || req.user.email || 'System'
    });
    app.stage = newStage;
    app.status = newStatus;

    await app.save();

    // Send notification email to candidate
    try {
      const candidate = await User.findById(app.userId);
      if (candidate && candidate.email) {
        const subject = `Update on your application for ${app.jobId}`;
        const html = `<p>Your application status for job <strong>${app.jobId}</strong> has been updated to <strong>${newStage}</strong>.</p><p>Note: ${note || ''}</p>`;
        await emailQueue.add('send-email', { to: candidate.email, subject, html });
      }
    } catch (e) {
      console.error('Failed to enqueue status update email', e);
    }

    return res.json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
});

// GET /api/company/:companyId/applications?jobId=&stage=
router.get('/company/:companyId/applications', protectUser, async (req, res, next) => {
  try {
    // Only members of the company (tenant) or admins can view
    const isCompanyMember = req.user.tenantId && req.user.tenantId.toString() === req.params.companyId.toString();
    const isAdmin = req.user.role && req.user.role === 'admin';
    if (!isCompanyMember && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });

    const filter = { companyId: req.params.companyId };
    if (req.query.jobId) filter.jobId = req.query.jobId;
    if (req.query.stage) filter.stage = req.query.stage;

    const apps = await JobApplication.find(filter).populate('userId jobId').sort({ date: -1 }).limit(200);
    res.json({ success: true, applications: apps });
  } catch (err) {
    next(err);
  }
});

export default router;
