import FinancialAuditLog from "../models/FinancialAuditLog.js";
import { resolveRequestId, resolveRequestIp } from "../utils/requestMeta.js";

export const logFinancialEvent = async ({
  tenantId,
  actorId,
  action,
  entityType,
  entityId,
  amount,
  currency = "KES",
  req,
  before,
  after,
  metadata = {},
}) => {
  try {
    await FinancialAuditLog.create({
      tenantId,
      actorId,
      action,
      entityType,
      entityId,
      amount,
      currency,
      requestId: resolveRequestId(req),
      ip: resolveRequestIp(req),
      userAgent: req?.headers["user-agent"] || "",
      before,
      after,
      metadata,
    });
  } catch (err) {
    console.error("Audit log failed", err);
  }
};
