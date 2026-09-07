import express from "express";
import { protectUser, protectedRouteRateLimit } from "../middleware/userAuth.js";
import {
  approveRefundRequest,
  createRefundRequest,
  getRefundRequests,
  markRefundProcessed,
  rejectRefundRequest,
} from "../controllers/refundController.js";

const router = express.Router();

const requireFinanceAdmin = (req, res, next) => {
  if (!["admin", "super_admin"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Finance admin only" });
  }
  next();
};

router.post("/request", protectedRouteRateLimit, protectUser, createRefundRequest);
router.get("/", protectedRouteRateLimit, protectUser, requireFinanceAdmin, getRefundRequests);
router.patch("/:id/approve", protectedRouteRateLimit, protectUser, requireFinanceAdmin, approveRefundRequest);
router.patch("/:id/reject", protectedRouteRateLimit, protectUser, requireFinanceAdmin, rejectRefundRequest);
router.patch("/:id/mark-processed", protectedRouteRateLimit, protectUser, requireFinanceAdmin, markRefundProcessed);

export default router;
