import { google } from 'googleapis';
import CalendarAuth from '../../models/CalendarAuth.js';
import { encrypt, decrypt } from '../crypto.js';

// Scopes used for calendar events
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function createOAuthClient() {
  const o = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  return o;
}

export function generateAuthUrl(state) {
  const oAuth2Client = createOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state
  });
}

export async function exchangeCodeForTokens(code) {
  const oAuth2Client = createOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  return tokens; // may include access_token, refresh_token, expiry_date
}

export async function storeGoogleTokensForUser(userId, tokens) {
  if (!tokens || !tokens.refresh_token) {
    // It's possible Google only returns a refresh token the first time consent is granted.
    // In that case, we should not overwrite an existing refresh token.
    const existing = await CalendarAuth.findOne({ userId });
    if (existing) return existing;
    throw new Error('No refresh token returned; please ensure prompt=consent and offline access');
  }

  const encrypted = encrypt(tokens.refresh_token);
  const scope = tokens.scope || SCOPES.join(' ');

  const rec = await CalendarAuth.findOneAndUpdate(
    { userId },
    { provider: 'google', encryptedRefreshToken: encrypted, scope },
    { upsert: true, new: true }
  );
  return rec;
}

export async function getOAuthClientForUser(userId) {
  const authRecord = await CalendarAuth.findOne({ userId });
  if (!authRecord) return null;
  const refreshToken = decrypt(authRecord.encryptedRefreshToken);
  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({ refresh_token: refreshToken });
  return oAuth2Client;
}

export async function createGoogleCalendarEvent(interview, recruiterUser, candidateUser) {
  // recruiterUser should be a User with email field
  const authRecord = await CalendarAuth.findOne({ userId: recruiterUser._id });
  if (!authRecord) throw new Error('No calendar auth record for user');

  const refreshToken = decrypt(authRecord.encryptedRefreshToken);
  if (!refreshToken) throw new Error('No refresh token available');

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const start = interview.bookedSlot.start;
  const end = interview.bookedSlot.end;
  const summary = `Interview: ${interview.jobId}`;
  const event = {
    summary,
    description: `Interview for job ${interview.jobId} (application ${interview.applicationId})`,
    start: { dateTime: new Date(start).toISOString() },
    end: { dateTime: new Date(end).toISOString() },
    attendees: [
      { email: recruiterUser.email },
    ],
    conferenceData: { createRequest: { requestId: `meet-${interview._id}` } }
  };

  if (candidateUser && candidateUser.email) {
    event.attendees.push({ email: candidateUser.email });
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1
  });

  return res.data; // contains id, htmlLink, hangoutLink etc
}
