export const resolveRequestIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req?.ip || "";

export const resolveRequestId = (req) => req?.requestId || req?.headers?.["x-request-id"] || "";
