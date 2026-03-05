// prestamosapi/src/routes/prestamos.routes.ts
import { Router } from "express";
import {
  getPrestamos,
  getPrestamoById,
  createPrestamo,
  updatePrestamo,
  deletePrestamo,
  simularPrestamo, // <--- Asegúrate que esto esté importado
  opcionesSimularPrestamoCapitalInteres,
  calcularTasaPorCuota,
  obtenerRangoCuotas,
  getPrestamosActivosCount
} from "../controllers/prestamo.controller";

const router = Router();

// ✅ ESTAS RUTAS DEBEN IR PRIMERO Y SER 'POST'
router.post("/simular", simularPrestamo); 
router.post("/simular-opciones", opcionesSimularPrestamoCapitalInteres);
router.post("/calcular-tasa", calcularTasaPorCuota);
router.post("/rango-cuotas", obtenerRangoCuotas);

// ✅ CRUD GENERAL
router.get("/", getPrestamos);
router.get("/conteo-activos/:idPrestatario", getPrestamosActivosCount);
router.post("/", createPrestamo);

// ✅ RUTAS DINÁMICAS (VAN AL FINAL)
router.get("/:id", getPrestamoById);
router.put("/:id", updatePrestamo);
router.delete("/:id", deletePrestamo);


export default router;