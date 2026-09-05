import express from 'express';
import { exchangeCodeForTokens, storeGoogleTokensForUser, generateAuthUrl } from '../lib/calendar/google.js';
import { protectUser } from '../middleware/userAuth.js';

const router = express.Router();

// GET /api/calendar/google/auth?state=<userId>
router.get('/calendar/google/auth', (req, res) => {
  const state = req.query.state || '';
  const url = generateAuthUrl(state);
  return res.json({ url });
});

// GET /api/calendar/google/callback?code=...&state=<userId>
// This endpoint exchanges the code for tokens and stores refresh token for the user indicated in 'state'.
// Note: 'state' should be the userId (or a signed token containing userId) to map the callback to the user.
router.get('/calendar/google/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state; // expected to be userId for now
  if (!code) return res.status(400).send('Missing code');
  if (!state) return res.status(400).send('Missing state');

  try {
    const tokens = await exchangeCodeForTokens(code);
    await storeGoogleTokensForUser(state, tokens);

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
