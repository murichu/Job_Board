import FileDownload from "../models/FileDownload.js";
import MpesaPayment from "../models/MpesaPayment.js";

export const getGlobalAnalytics = async (req, res) => {
  const total = await FileDownload.countDocuments({ status: "success" });

  const topUsers = await FileDownload.aggregate([
    { $match: { status: "success" } },
    { $group: { _id: "$ownerUserId", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  const suspiciousIPs = await FileDownload.aggregate([
    { $match: { status: "invalid" } },
    { $group: { _id: "$ipAddress", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 },
  ]);

  res.json({ success: true, total, topUsers, suspiciousIPs });
};

export const getFraudData = async (req, res) => {
  try {
    const payments = await MpesaPayment.find({ suspicious: true })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
