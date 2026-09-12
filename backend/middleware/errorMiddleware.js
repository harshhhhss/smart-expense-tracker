export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Maps an error onto the status code and message the client should see.
// Mongoose signals bad *client* input with ValidationError (schema rule broken,
// e.g. an invalid category enum), CastError (unparseable value, e.g. a malformed
// ObjectId in :id) and code 11000 (unique index violation) -- all of which are
// 400s, not 500s. Anything else is treated as a genuine server fault.
export const classifyError = (err, fallbackStatus = 500) => {
  if (err?.name === "ValidationError" && err.errors) {
    return {
      statusCode: 400,
      message: Object.values(err.errors)
        .map((fieldError) => fieldError.message)
        .join(", ")
    };
  }

  if (err?.name === "CastError") {
    return { statusCode: 400, message: `Invalid value for "${err.path}"` };
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return {
      statusCode: 400,
      message: field ? `That ${field} is already in use` : "That record already exists"
    };
  }

  return { statusCode: fallbackStatus, message: err?.message || "Server error" };
};

// Shared catch-block helper for handlers that respond directly instead of
// delegating to the errorHandler middleware via next(error).
export const handleError = (res, err) => {
  const { statusCode, message } = classifyError(err);
  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err?.stack
  });
};

export const errorHandler = (err, req, res, next) => {
  const fallbackStatus = res.statusCode === 200 ? 500 : res.statusCode;
  const { statusCode, message } = classifyError(err, fallbackStatus);

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
};
