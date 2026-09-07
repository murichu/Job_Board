import express from 'express';
import jwt from 'jsonwebtoken';
import { exchangeCodeForTokens, storeGoogleTokensForUser, generateAuthUrl } from '../lib/calendar/google.js';
import { protectUser } from '../middleware/userAuth.js';

const router = express.Router();

// GET /api/calendar/google/auth
router.get('/calendar/google/auth', protectUser, (req, res) => {
  const state = jwt.sign(
    { userId: String(req.userId), purpose: 'google-calendar' },
    process.env.JWT_SECRET,
    { expiresIn: '10m' }
  );
  const url = generateAuthUrl(state);
  return res.json({ url });
});

// GET /api/calendar/google/callback?code=...&state=<signed-state>
router.get('/calendar/google/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (!code) return res.status(400).send('Missing code');
  if (!state) return res.status(400).send('Missing state');

  try {
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    if (decoded.purpose !== 'google-calendar' || !decoded.userId) {
      return res.status(400).send('Invalid state');
    }

    const tokens = await exchangeCodeForTokens(code);
    await storeGoogleTokensForUser(decoded.userId, tokens);

    // Redirect back to client app with success flag
    const redirect = `${process.env.APP_URL || ''}/calendar-connected?success=1`;
    return res.redirect(redirect);
  } catch (err) {
    console.error('Google callback error', err);
    const redirect = `${process.env.APP_URL || ''}/calendar-connected?success=0`;
    return res.redirect(redirect);
  }
});

export default router;
