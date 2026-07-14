"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (err) {
        if (err instanceof zod_1.ZodError) {
            const firstMessage = err.issues.length > 0 ? err.issues[0].message : 'Datos inválidos';
            return res.status(400).json({
                success: false,
                message: firstMessage,
                error: firstMessage,
                errors: err.issues,
            });
        }
        next(err);
    }
};
exports.validate = validate;
