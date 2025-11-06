"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
function errorHandler(err, req, res, next) {
    console.error("Error detectado:", err);
    let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
    let message = "Error interno del servidor";
    if (err instanceof Error) {
        message = err.message;
    }
    else if (typeof err === "string") {
        message = err;
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        method: req.method,
        path: req.originalUrl,
        ...(process.env.NODE_ENV === "development" && err instanceof Error
            ? { stack: err.stack }
            : {}),
    });
}
