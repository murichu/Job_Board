import AuditLog from "../models/AuditLog.js";
import { resolveRequestId, resolveRequestIp } from "../utils/requestMeta.js";

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
      requestId: resolveRequestId(req),
      ip: resolveRequestIp(req),
      userAgent: req?.headers?.["user-agent"] || "",
      metadata,
    });
  } catch (error) {
    console.error("Audit log failed", error);
  }
};
