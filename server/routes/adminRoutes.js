import express from "express";
import { protectUser } from "../middleware/userAuth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { getGlobalAnalytics, getFraudData } from "../controllers/adminController.js";
import { getAuditLogs } from "../controllers/insightController.js";

const router = express.Router();

// Global analytics
router.get("/analytics", protectUser, requireAdmin, getGlobalAnalytics);

// Fraud and Audit
router.get("/fraud", protectUser, requireAdmin, getFraudData);
router.get("/audit-logs", protectUser, requireAdmin, getAuditLogs);

export default router;
