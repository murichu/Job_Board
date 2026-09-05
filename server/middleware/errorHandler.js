import winston from "winston";

const logger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error({
    message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?._id || req.company?._id,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

export { logger };
export default errorHandler;