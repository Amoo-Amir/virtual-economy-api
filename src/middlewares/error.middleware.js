const ApiError = require("../utils/ApiError");

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    err instanceof ApiError ? err.statusCode : 500;

  const message =
    err instanceof ApiError
      ? err.message
      : "Internal server error";

  if (statusCode === 500) {
    console.error("[ERROR]", err);
  }

  return res.status(statusCode).json({
    status: "error",
    message,
  });
};

module.exports = errorHandler;