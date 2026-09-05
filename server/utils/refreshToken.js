import crypto from "crypto";
import RefreshSession from "../models/RefreshSession.js";

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const REFRESH_COOKIE_NAME = "refreshToken";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const clientIp = (req) => req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req?.ip || "";

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api",
  maxAge: REFRESH_TOKEN_TTL_MS,
});

// maxAge is omitted here since res.clearCookie() ignores/deprecates it — it always expires immediately.
export const getClearRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api",
});

// Creates a new RefreshSession record and returns the raw cookie value (never stored directly).
export const issueRefreshSession = async ({ actorId, actorType = "user", tenantId = null, req }) => {
  const sessionId = crypto.randomUUID();
  const rawToken = crypto.randomBytes(40).toString("hex");

  await RefreshSession.create({
    userId: actorId,
    actorType,
    tenantId,
    sessionId,
    refreshTokenHash: hashToken(rawToken),
    device: req?.headers?.["user-agent"] || "",
    ip: clientIp(req),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  return `${sessionId}.${rawToken}`;
};

const parseCookieValue = (value) => {
  if (!value || typeof value !== "string" || !value.includes(".")) return null;
  const [sessionId, rawToken] = value.split(".");
  if (!sessionId || !rawToken) return null;
  return { sessionId, rawToken };
};

export const getSessionIdFromCookieValue = (value) => parseCookieValue(value)?.sessionId || null;

// Verifies the refresh cookie against the stored session and rotates it (revoke old, issue new).
// Detects refresh-token reuse (a revoked/invalid token presented again) and revokes all sessions for that actor as a precaution.
export const rotateRefreshSession = async (cookieValue, { actorType = "user", req } = {}) => {
  const parsed = parseCookieValue(cookieValue);
  if (!parsed) return { error: "invalid" };

  const session = await RefreshSession.findOne({ sessionId: parsed.sessionId, actorType });
  if (!session) return { error: "invalid" };

  const providedHash = Buffer.from(hashToken(parsed.rawToken));
  const storedHash = Buffer.from(session.refreshTokenHash);
  const isValidHash =
    providedHash.length === storedHash.length && crypto.timingSafeEqual(providedHash, storedHash);

  if (!isValidHash || session.revokedAt || session.expiresAt < new Date()) {
    if (isValidHash) {
      // Token matches a session that's already revoked/expired but was reused — treat as compromised.
      await RefreshSession.updateMany(
        { userId: session.userId, actorType, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }
    return { error: "invalid" };
  }

  session.revokedAt = new Date();
  await session.save();

  const newCookieValue = await issueRefreshSession({
    actorId: session.userId,
    actorType,
    tenantId: session.tenantId,
    req,
  });
  const newSessionId = getSessionIdFromCookieValue(newCookieValue);

  return { actorId: session.userId, tenantId: session.tenantId, newCookieValue, newSessionId };
};

export const revokeRefreshSession = async (cookieValue, { actorType = "user" } = {}) => {
  const parsed = parseCookieValue(cookieValue);
  if (!parsed) return;
  await RefreshSession.updateOne(
    { sessionId: parsed.sessionId, actorType, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};

export const revokeAllRefreshSessionsForActor = async (actorId, { actorType = "user" } = {}) => {
  await RefreshSession.updateMany(
    { userId: actorId, actorType, revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
};
