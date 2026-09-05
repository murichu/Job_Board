import { REFRESH_COOKIE_NAME } from "../utils/refreshToken.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SAME_SITE_VALUES = new Set(["same-origin", "same-site", "none"]);

const toOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
};

export const createCsrfGuard = ({ allowedOrigins = [] } = {}) => {
  const allowed = new Set(allowedOrigins);

  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    if (!req.cookies?.[REFRESH_COOKIE_NAME]) return next();

    const origin = req.get("origin") || "";
    const refererOrigin = toOrigin(req.get("referer") || "");

    if (origin) {
      if (allowed.has(origin)) return next();
      return res.status(403).json({ success: false, message: "CSRF validation failed." });
    }

    if (refererOrigin) {
      if (allowed.has(refererOrigin)) return next();
      return res.status(403).json({ success: false, message: "CSRF validation failed." });
    }

    const fetchSite = req.get("sec-fetch-site");
    if (fetchSite && !SAME_SITE_VALUES.has(fetchSite)) {
      return res.status(403).json({ success: false, message: "CSRF validation failed." });
    }

    return next();
  };
};
