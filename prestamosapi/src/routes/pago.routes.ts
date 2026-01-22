import { Router } from "express";
import {
  getAllPagos,
  getPagoById,
  createPago,
  getProximaCuota,
  updatePago,
  deletePago,
} from "../controllers/pago.controller"; // Verifica si tu archivo es 'pago.controller' o 'pagos.controller'
import { validate } from "../middlewares/validate";
// Asegúrate de tener estos esquemas creados (te dejo el código abajo por si acaso)
import { pagoSchema, pagoAutomaticoSchema } from "../validators/pago.validator";

const router = Router();

// --- RUTAS DE CONSULTA ---

// Obtener todos los pagos del sistema
router.get("/", getAllPagos);

// Obtener información de la próxima cuota de un préstamo
// 🚨 CAMBIO: Método GET y parámetro :IdPrestamo explícito
router.get("/proxima-cuota/:IdPrestamo", getProximaCuota);

// Obtener un pago específico por su ID
router.get("/:id", getPagoById);


// --- RUTAS DE ACCIÓN ---

// Registrar un nuevo pago (Cobrar)
// Usa el esquema 'pagoAutomaticoSchema' que valida IdPrestamo, Monto y TipoPago
router.post("/", validate(pagoAutomaticoSchema), createPago);

// Actualizar un pago (Corrección de errores)
router.put("/:id", validate(pagoSchema.partial()), updatePago); 

// Eliminar un pago (Reversión)
router.delete("/:id", deletePago);

export default router;