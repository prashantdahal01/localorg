
import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  if (err?.code === 11000) {
    return res.status(409).json({ success: false, message: "A member with one of those details already exists." })
  }
  const requestedStatus = err?.statusCode ?? err?.status;
  const statusCode =
    Number.isInteger(requestedStatus) &&
    requestedStatus >= 400 &&
    requestedStatus <= 599
      ? requestedStatus
      : 500;
  const message =
    statusCode < 500 && typeof err?.message === "string"
      ? err.message
      : "Internal server error";

  logger.error({ err, method: req.method, path: req.originalUrl }, message);

  return res.status(statusCode).json({
    success: false,
    message,
  });
};