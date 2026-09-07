import { initializePayment, verifyPayment, verifyPaystackSignature } from "../services/paystackService.js";

export const initializePaystackPayment = async (req, res) => {
  const amount = Number(req.body.amount);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: "Amount must be a positive whole number" });
  }

  const data = await initializePayment({
    email: req.user.email,
    amount,
    metadata: {
      userId: String(req.user._id),
      tenantId: req.user.tenantId ? String(req.user.tenantId) : null,
    },
  });
  res.json({ success: true, data });
};

export const verifyPaystackPayment = async (req, res) => {
  const data = await verifyPayment(req.params.reference);

  const ownerId = data?.metadata?.userId;
  const customerEmail = data?.customer?.email?.toLowerCase();
  if (ownerId !== String(req.user._id) && customerEmail !== req.user.email?.toLowerCase()) {
    return res.status(403).json({ success: false, message: "Payment does not belong to this account" });
  }

  res.json({ success: true, data });
};

export const handlePaystackWebhook = async (req, res) => {
  const signature = req.headers["x-paystack-signature"];

  if (!verifyPaystackSignature(req.body, signature)) {
    return res.status(401).send("Invalid signature");
  }

  const event = JSON.parse(req.body.toString());

  if (event.event === "charge.success") {
    // TODO: mark invoice as paid
    console.log("Payment success:", event.data.reference);
  }

  res.sendStatus(200);
};
