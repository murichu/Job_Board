import express from "express";

const router = express.Router();

// Health check endpoint
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    message: "Job Portal Backend is running smoothly"
  });
});

export default router;