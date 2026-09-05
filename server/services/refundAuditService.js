import mongoose from "mongoose";
import Invoice from "../models/Invoice.js";
import MpesaPayment from "../models/MpesaPayment.js";

export const resolveRefundCurrency = async ({ invoice = null, paymentId = null } = {}) => {
  if (invoice?.currency) return invoice.currency;
  if (!paymentId || !mongoose.Types.ObjectId.isValid(String(paymentId))) return "KES";
  const paymentObjectId = new mongoose.Types.ObjectId(String(paymentId));

  const payment = await MpesaPayment.findById(paymentObjectId).select("invoiceId").lean();
  if (!payment?.invoiceId || !mongoose.Types.ObjectId.isValid(String(payment.invoiceId))) return "KES";
  const invoiceObjectId = new mongoose.Types.ObjectId(String(payment.invoiceId));

  const paymentInvoice = await Invoice.findById(invoiceObjectId).select("currency").lean();
  return paymentInvoice?.currency || "KES";
};
