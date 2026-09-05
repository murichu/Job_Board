import { v4 as uuidv4 } from "uuid";

export const attachRequestId = (req, res, next) => {
  const incomingRequestId =
    typeof req.headers["x-request-id"] === "string"
      ? req.headers["x-request-id"].trim()
      : "";
  const requestId = incomingRequestId || uuidv4();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
};
