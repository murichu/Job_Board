import TenantSubscription from "../models/TenantSubscription.js";
import Invoice from "../models/Invoice.js";
import MpesaPayment from "../models/MpesaPayment.js";
import RefundRequest from "../models/RefundRequest.js";
import { generateInvoicePDF } from "../services/pdfService.js";
import { sendEmail } from "../services/emailService.js";
import { invoicePaidTemplate } from "../templates/emailTemplates.js";
import { logFinancialEvent } from "../services/financialAuditService.js";

const resolveRefundCurrency = async ({ invoice, paymentId }) => {
  if (invoice?.currency) return invoice.currency;
  if (!paymentId) return "KES";
  const payment = await MpesaPayment.findById(paymentId).select("invoiceId").lean();
  if (!payment?.invoiceId) return "KES";
  const paymentInvoice = await Invoice.findById(payment.invoiceId).select("currency").lean();
  return paymentInvoice?.currency || "KES";
};

export const getSubscription = async (req, res) => {
  const sub = await TenantSubscription.findOne({ tenantId: req.user.tenantId });
  res.json({ success: true, sub, subscription: sub });
};

export const getInvoices = async (req, res) => {
  const invoices = await Invoice.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
  res.json({ success: true, invoices });
};

export const getPaymentHistory = async (req, res) => {
  const payments = await MpesaPayment.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
  res.json({ success: true, payments });
};

export const requestRefund = async (req, res) => {
  const { invoiceId, paymentId, amount, reason = "Customer requested refund" } = req.body;

  const invoice = invoiceId ? await Invoice.findOne({ _id: invoiceId, tenantId: req.user.tenantId }) : null;
  const currency = await resolveRefundCurrency({ invoice, paymentId });

  const refundRequest = await RefundRequest.create({
    paymentId: paymentId || null,
    tenantId: req.user.tenantId,
    userId: req.user._id,
    amount: amount || invoice?.amount || 0,
    reason,
  });
  await logFinancialEvent({
    tenantId: req.user.tenantId,
    actorId: req.user._id,
    action: "billing.refund_requested",
    entityType: "RefundRequest",
    entityId: refundRequest._id,
    amount: refundRequest.amount,
    currency,
    req,
    after: { status: refundRequest.status },
    metadata: {
      paymentId: refundRequest.paymentId,
      invoiceId: invoice?._id || null,
      reason: refundRequest.reason,
    },
  });

  res.json({ success: true, request: refundRequest });
};

export const downloadInvoicePdf = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

  const pdf = await generateInvoicePDF(invoice);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice._id}.pdf`);
  res.send(pdf);
};

export const emailInvoice = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
  if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

  const pdf = await generateInvoicePDF(invoice);
  const template = invoicePaidTemplate({ amount: invoice.amount });

  await sendEmail({
    to: req.user.email,
    subject: template.subject,
    html: template.html,
    attachments: [{ filename: `invoice-${invoice._id}.pdf`, content: pdf }],
  });

  res.json({ success: true, message: "Invoice emailed" });
};
