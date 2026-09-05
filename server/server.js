import dotenv from "dotenv";
import express from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";

import connectDB from "./config/mongoDB.js";
import connectCloudinary from "./config/Cloudinary.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { initSocket } from "./socket.js";

import healthRoutes from "./routes/healthRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import userRouter from "./routes/userRouter.js";
import companyRouter from "./routes/companyRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import billingAnalyticsRoutes from "./routes/billingAnalytics.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import emailAnalyticsRoutes from "./routes/emailAnalyticsRoutes.js";
import emailPreferenceRoutes from "./routes/emailPreferenceRoutes.js";
import financeAdminRoutes from "./routes/financeAdminRoutes.js";
import financeReportsRoutes from "./routes/financeReports.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import insightRoutes from "./routes/insightRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import monitorRoutes from "./routes/monitorRoutes.js";
import mpesaRoutes from "./routes/mpesaRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import paystackRoutes from "./routes/paystackRoutes.js";
import refundRoutes from "./routes/refundRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import taxExportRoutes from "./routes/taxExportRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import tenantAnalyticsRoutes from "./routes/tenantAnalyticsRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const preferredPorts = [Number(process.env.PORT || 5000), 5001, 5002, 5003];
let activePortIndex = 0;

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):517[0-9]$/.test(origin);
      if (isLocalDevOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.json({ success: true, message: "Job Portal API is running" });
});

app.use("/api/health", healthRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/user", userRouter);
app.use("/api/company", companyRouter);
app.use("/api/admin", adminRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/billing-analytics", billingAnalyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/email-analytics", emailAnalyticsRoutes);
app.use("/api/email-preferences", emailPreferenceRoutes);
app.use("/api/finance", financeAdminRoutes);
app.use("/api/finance-reports", financeReportsRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/insights", insightRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/monitor", monitorRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/paystack", paystackRoutes);
app.use("/api/refund", refundRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/tax", taxExportRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/tenant-analytics", tenantAnalyticsRoutes);
app.use("/api/campaign", campaignRoutes);

initSocket(server);

app.use(errorHandler);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    await connectCloudinary();

    const listenOnPort = (port) => {
      server.once("error", (error) => {
        if (error.code === "EADDRINUSE") {
          const nextIndex = activePortIndex + 1;
          if (nextIndex < preferredPorts.length) {
            activePortIndex = nextIndex;
            const nextPort = preferredPorts[nextIndex];
            console.warn(`Port ${port} is busy. Retrying on ${nextPort}...`);
            listenOnPort(nextPort);
            return;
          }

          console.error("All preferred ports are busy. Please stop the other Node process and try again.");
          process.exit(1);
        }

        console.error("Server error:", error);
        process.exit(1);
      });

      server.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${port}`);
      });
    };

    listenOnPort(preferredPorts[activePortIndex]);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
