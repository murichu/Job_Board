import jwt from "jsonwebtoken";

// Short-lived access token; long-lived sessions are handled via the httpOnly refresh-token cookie (see utils/refreshToken.js).
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";

const generateToken = (id, role = "user") => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
};

export default generateToken;
