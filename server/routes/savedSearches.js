import express from 'express';
import Joi from 'joi';
import SavedSearch from '../models/SavedSearch.js';
import Job from '../models/Job.js';
import { Queue } from 'bullmq';
import connection from '../utils/redis.js';
import { protectUser } from '../middleware/userAuth.js';

const router = express.Router();
const savedSearchQueue = new Queue('saved-searches', { connection });

const createSchema = Joi.object({
  name: Joi.string().max(200).required(),
  keywords: Joi.array().items(Joi.string()).optional(),
  location: Joi.string().optional().allow(null,''),
  skills: Joi.array().items(Joi.string()).optional(),
  frequency: Joi.string().valid('immediate','daily','weekly').default('daily')
});

// POST /api/saved-searches
router.post('/saved-searches', protectUser, async (req, res, next) => {
  try {
    const { error, value } = createSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    const doc = new SavedSearch({
      user: req.userId,
      name: value.name,
      keywords: value.keywords || [],
      location: value.location || '',
      skills: value.skills || [],
      frequency: value.frequency
    });

    await doc.save();

    // If immediate, enqueue a job to check now
    if (value.frequency === 'immediate') {
      await savedSearchQueue.add('run-search', { savedSearchId: doc._id.toString() });
    }

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// GET /api/saved-searches
router.get('/saved-searches', protectUser, async (req, res, next) => {
  try {
    const docs = await SavedSearch.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/saved-searches/:id
router.delete('/saved-searches/:id', protectUser, async (req, res, next) => {
  try {
    const doc = await SavedSearch.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (doc.user.toString() !== req.userId.toString()) return res.status(403).json({ error: 'Forbidden' });

    await doc.remove();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
