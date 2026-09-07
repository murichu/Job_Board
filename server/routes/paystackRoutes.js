import express from "express";
import {
  handlePaystackWebhook,
  initializePaystackPayment,
  verifyPaystackPayment,
} from "../controllers/paystackController.js";
import { protectUser } from "../middleware/userAuth.js";

const router = express.Router();

router.post("/initialize", protectUser, initializePaystackPayment);
router.get("/verify/:reference", protectUser, verifyPaystackPayment);

// Webhook endpoint (IMPORTANT)
router.post("/webhook", express.raw({ type: "application/json" }), handlePaystackWebhook);

export default router;
