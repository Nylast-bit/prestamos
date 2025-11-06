"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    }
    catch (err) {
        if (err instanceof Error && "errors" in err) {
            return res.status(400).json({
                success: false,
                errors: err.errors,
            });
        }
        next(err);
    }
};
exports.validate = validate;
