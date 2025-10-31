// src/routes/pago.routes.ts
import { Router } from "express";
import {
  getAllPagos,
  getPagoById,
  createPago,
  getProximaCuota,
  updatePago,
  deletePago,
} from "../controllers/pago.controller";
import { validate } from "../middlewares/validate";
import { pagoSchema, pagoAutomaticoSchema } from "../validators/pago.validator";

const router = Router();

router.get("/", getAllPagos);
router.get("/:id", getPagoById);
router.post("/", validate(pagoAutomaticoSchema), createPago);
router.post("/:id/proxima-cuota", getProximaCuota);
router.put("/:id", validate(pagoSchema.partial()), updatePago); // .partial() porque en update no es obligatorio enviar todos los campos
router.delete("/:id", deletePago);

export default router;
