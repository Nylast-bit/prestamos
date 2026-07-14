"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pago_controller_1 = require("../controllers/pago.controller");
const validate_1 = require("../middlewares/validate");
const pago_validator_1 = require("../validators/pago.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// ==========================================
// RUTAS DE CONSULTA (GET)
// ==========================================
// 1. Obtener todos los pagos
router.get("/", pago_controller_1.getAllPagos);
// 2. Rutas ESPECÍFICAS (Deben ir antes de las genéricas con :id)
// Obtener historial completo de un préstamo (para la tabla clickable)
// URL Final: /api/pagos/historial/:id
router.get("/historial/:id", pago_controller_1.getHistorialPagos);
// Obtener información de la próxima cuota
// URL Final: /api/pagos/proxima-cuota/:IdPrestamo
router.get("/proxima-cuota/:IdPrestamo", pago_controller_1.getProximaCuota);
// 3. Ruta GENÉRICA (Debe ir al final de los GETs)
// Obtener un pago específico por su ID de pago
// URL Final: /api/pagos/:id
router.get("/:id", pago_controller_1.getPagoById);
// ==========================================
// RUTAS DE ACCIÓN (POST, PUT, DELETE)
// ==========================================
// Registrar un nuevo pago (Cobrar)
router.post("/", (0, validate_1.validate)(pago_validator_1.pagoAutomaticoSchema), pago_controller_1.createPago);
// Actualizar un pago
router.put("/:id", (0, validate_1.validate)(pago_validator_1.pagoSchema.partial()), pago_controller_1.updatePago);
// Eliminar un pago
router.delete("/:id", pago_controller_1.deletePago);
exports.default = router;
