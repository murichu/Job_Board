import { v4 as uuidv4 } from "uuid";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export const attachRequestId = (req, res, next) => {
  const incomingRequestIdRaw =
    typeof req.headers["x-request-id"] === "string"
      ? req.headers["x-request-id"].trim()
      : "";
  const incomingRequestId = REQUEST_ID_PATTERN.test(incomingRequestIdRaw)
    ? incomingRequestIdRaw
    : "";
  const requestId = incomingRequestId || uuidv4();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
};
