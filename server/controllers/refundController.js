import RefundRequest from "../models/RefundRequest.js";
import { logFinancialEvent } from "../services/financialAuditService.js";

const canAccessRefund = (req, refundRequest) =>
  req.user.role === "super_admin" || String(refundRequest.tenantId) === String(req.user.tenantId);

const updateRefundStatus = async (req, res, status, defaultNotes) => {
  const refundRequest = await RefundRequest.findById(req.params.id);
  if (!refundRequest) return res.status(404).json({ success: false, message: "Refund request not found" });

  if (!canAccessRefund(req, refundRequest)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const previousStatus = refundRequest.status;
  refundRequest.status = status;
  refundRequest.reviewedBy = req.user._id;
  refundRequest.reviewedAt = new Date();
  refundRequest.notes = req.body.notes || defaultNotes;
  await refundRequest.save();
  await logFinancialEvent({
    tenantId: refundRequest.tenantId,
    actorId: req.user._id,
    action: `refund.${status}`,
    entityType: "RefundRequest",
    entityId: refundRequest._id,
    amount: refundRequest.amount,
    currency: "KES",
    req,
    before: { status: previousStatus },
    after: { status: refundRequest.status },
    metadata: { notes: refundRequest.notes },
  });

  res.json({ success: true, request: refundRequest });
};

export const createRefundRequest = async (req, res) => {
  const { paymentId, amount, reason } = req.body;

  const refundRequest = await RefundRequest.create({
    paymentId,
    amount,
    reason,
    userId: req.user._id,
    tenantId: req.user.tenantId,
  });
  await logFinancialEvent({
    tenantId: req.user.tenantId,
    actorId: req.user._id,
    action: "refund.requested",
    entityType: "RefundRequest",
    entityId: refundRequest._id,
    amount: refundRequest.amount,
    currency: "KES",
    req,
    after: { status: refundRequest.status },
    metadata: { paymentId: refundRequest.paymentId, reason: refundRequest.reason },
  });

  res.json({ success: true, request: refundRequest });
};

export const getRefundRequests = async (req, res) => {
  const filter = req.user.role === "super_admin" ? {} : { tenantId: req.user.tenantId };
  const requests = await RefundRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate("paymentId userId", "phone amount status email name");
  res.json({ success: true, requests });
};

export const approveRefundRequest = async (req, res) => {
  await updateRefundStatus(req, res, "approved", "Approved for manual M-Pesa reversal processing.");
};

export const rejectRefundRequest = async (req, res) => {
  await updateRefundStatus(req, res, "rejected", "Rejected after review.");
};

export const markRefundProcessed = async (req, res) => {
  await updateRefundStatus(req, res, "processed", "Refund processed manually.");
};
