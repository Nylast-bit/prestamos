// src/routes/prestamo.routes.ts
import { Router } from "express";
import {
  getPrestamos,
  getPrestamoById,
  createPrestamo,
  updatePrestamo,
  deletePrestamo,
  simularPrestamo,
  opcionesSimularPrestamoCapitalInteres,
  calcularTasaPorCuota,
  getPrestamoParaEliminar
} from "../controllers/prestamo.controller";
import { validate } from "../middlewares/validate";
import { prestamoSchema } from "../validators/prestamo.validator";

const router = Router();

router.get("/", getPrestamos);
router.get("/:id", getPrestamoById);
router.post("/", validate(prestamoSchema), createPrestamo);
router.put("/:id", validate(prestamoSchema.partial()), updatePrestamo); // .partial() porque en update no es obligatorio todo
router.delete("/:id", deletePrestamo);
router.get("/:id/eliminar-info", getPrestamoParaEliminar);
router.post("/simular", simularPrestamo);
router.post("/simular/opcionescapitalinteres", opcionesSimularPrestamoCapitalInteres);
router.post('/calcular-tasa-por-cuota', calcularTasaPorCuota);

export default router;
