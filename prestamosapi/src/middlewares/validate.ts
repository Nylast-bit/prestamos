import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
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
