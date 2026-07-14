"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    logger_1.logger.error("Error detectado:", err);
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
        message: message,
        method: req.method,
        path: req.originalUrl,
        ...(process.env.NODE_ENV === "development" && err instanceof Error
            ? { stack: err.stack }
            : {}),
    });
}
