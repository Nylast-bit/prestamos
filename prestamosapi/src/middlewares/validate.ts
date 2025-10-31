import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof Error && "errors" in err) {
        return res.status(400).json({
          success: false,
          errors: (err as any).errors,
        });
      }
      next(err);
    }
  };
