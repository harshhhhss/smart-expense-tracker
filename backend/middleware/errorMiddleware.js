// ─────────────────────────────────────────────
//  middleware/errorMiddleware.js — Error Handlers
// ─────────────────────────────────────────────

// ── 404 Handler — catches undefined routes ──
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// ── Global Error Handler ──
// Express recognizes this as an error handler because it has 4 parameters
const errorHandler = (err, req, res, next) => {
  // Sometimes Express sets status 200 even on thrown errors — normalize it
  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message;

  // ── Handle Mongoose CastError (invalid ObjectId) ──
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // ── Handle Mongoose Duplicate Key Error ──
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // ── Handle Mongoose Validation Errors ──
  if (err.name === "ValidationError") {
    statusCode = 400;
    // Extract all validation messages and join them
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ── Handle JWT Errors (fallback if not caught in middleware) ──
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Stack trace only in development — never expose in production
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };