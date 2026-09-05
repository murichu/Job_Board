import RefundRequest from "../models/RefundRequest.js";
import MpesaPayment from "../models/MpesaPayment.js";
import mongoose from "mongoose";
import { logFinancialEvent } from "../services/financialAuditService.js";
import { resolveRefundCurrency } from "../services/refundAuditService.js";

const canAccessRefund = (req, refundRequest) =>
  req.user.role === "super_admin" || String(refundRequest.tenantId) === String(req.user.tenantId);

const updateRefundStatus = async (req, res, status, defaultNotes) => {
  const refundRequest = await RefundRequest.findById(req.params.id);
  if (!refundRequest) return res.status(404).json({ success: false, message: "Refund request not found" });

  if (!canAccessRefund(req, refundRequest)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const previousStatus = refundRequest.status;
  const statusChanged = previousStatus !== status;
  refundRequest.status = status;
  refundRequest.reviewedBy = req.user._id;
  refundRequest.reviewedAt = new Date();
  refundRequest.notes = req.body.notes || defaultNotes;
  await refundRequest.save();
  if (statusChanged) {
    try {
      const currency = await resolveRefundCurrency({ paymentId: refundRequest.paymentId });
      await logFinancialEvent({
        tenantId: refundRequest.tenantId,
        actorId: req.user._id,
        action: `refund.${status}`,
        entityType: "RefundRequest",
        entityId: refundRequest._id,
        amount: refundRequest.amount,
        currency,
        req,
        before: { status: previousStatus },
        after: { status: refundRequest.status },
        metadata: { notes: refundRequest.notes },
      });
    } catch (error) {
      console.error("Financial audit log failed", error);
    }
  }

  res.json({ success: true, request: refundRequest });
};

export const createRefundRequest = async (req, res) => {
  const { paymentId, amount, reason } = req.body;
  if (!paymentId || !mongoose.Types.ObjectId.isValid(String(paymentId))) {
    return res.status(400).json({ success: false, message: "Valid payment ID is required." });
  }
  const payment = await MpesaPayment.findOne({
    _id: paymentId,
    tenantId: req.user.tenantId,
  }).select("_id");
  if (!payment) {
    return res.status(404).json({ success: false, message: "Payment not found" });
  }

  const refundRequest = await RefundRequest.create({
    paymentId: payment._id,
    amount,
    reason,
    userId: req.user._id,
    tenantId: req.user.tenantId,
  });
  try {
    const currency = await resolveRefundCurrency({ paymentId: refundRequest.paymentId });
    await logFinancialEvent({
      tenantId: req.user.tenantId,
      actorId: req.user._id,
      action: "refund.requested",
      entityType: "RefundRequest",
      entityId: refundRequest._id,
      amount: refundRequest.amount,
      currency,
      req,
      after: { status: refundRequest.status },
      metadata: { paymentId: refundRequest.paymentId, reason: refundRequest.reason },
    });
  } catch (error) {
    console.error("Financial audit log failed", error);
  }

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
