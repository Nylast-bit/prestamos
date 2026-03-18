import { Router } from "express";
import {
  getAllPagos,
  getPagoById,
  createPago,
  getProximaCuota,
  updatePago,
  deletePago,
  getHistorialPagos
} from "../controllers/pago.controller";
import { validate } from "../middlewares/validate";
import { pagoSchema, pagoAutomaticoSchema } from "../validators/pago.validator";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

// ==========================================
// RUTAS DE CONSULTA (GET)
// ==========================================

// 1. Obtener todos los pagos
router.get("/", getAllPagos);

// 2. Rutas ESPECÍFICAS (Deben ir antes de las genéricas con :id)
// Obtener historial completo de un préstamo (para la tabla clickable)
// URL Final: /api/pagos/historial/:id
router.get("/historial/:id", getHistorialPagos);

// Obtener información de la próxima cuota
// URL Final: /api/pagos/proxima-cuota/:IdPrestamo
router.get("/proxima-cuota/:IdPrestamo", getProximaCuota);

// 3. Ruta GENÉRICA (Debe ir al final de los GETs)
// Obtener un pago específico por su ID de pago
// URL Final: /api/pagos/:id
router.get("/:id", getPagoById);


// ==========================================
// RUTAS DE ACCIÓN (POST, PUT, DELETE)
// ==========================================

// Registrar un nuevo pago (Cobrar)
router.post("/", validate(pagoAutomaticoSchema), createPago);

// Actualizar un pago
router.put("/:id", validate(pagoSchema.partial()), updatePago);

// Eliminar un pago
router.delete("/:id", deletePago);

export default router;