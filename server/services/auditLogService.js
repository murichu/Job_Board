import AuditLog from "../models/AuditLog.js";

const resolveIp = (req) =>
  req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() || req?.ip || "";

export const logAuditEvent = async ({
  req,
  userId = null,
  tenantId = null,
  action,
  metadata = {},
}) => {
  if (!action) return;

  try {
    await AuditLog.create({
      userId,
      tenantId,
      action,
      requestId: req?.requestId || req?.headers?.["x-request-id"] || "",
      ip: resolveIp(req),
      userAgent: req?.headers?.["user-agent"] || "",
      metadata,
    });
  } catch (error) {
    console.error("Audit log failed", error);
  }
};
