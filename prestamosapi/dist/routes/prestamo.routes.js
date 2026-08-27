"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// prestamosapi/src/routes/prestamos.routes.ts
const express_1 = require("express");
const prestamo_controller_1 = require("../controllers/prestamo.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validate_1 = require("../middlewares/validate");
const prestamo_validator_1 = require("../validators/prestamo.validator");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// ✅ ESTAS RUTAS DEBEN IR PRIMERO Y SER 'POST'
router.post("/simular", prestamo_controller_1.simularPrestamo);
router.post("/simular-opciones", prestamo_controller_1.opcionesSimularPrestamoCapitalInteres);
router.post("/calcular-tasa", prestamo_controller_1.calcularTasaPorCuota);
router.post("/rango-cuotas", prestamo_controller_1.obtenerRangoCuotas);
// ✅ CRUD GENERAL
router.get("/", prestamo_controller_1.getPrestamos);
router.get("/conteo-activos/:idPrestatario", prestamo_controller_1.getPrestamosActivosCount);
router.post("/", (0, validate_1.validate)(prestamo_validator_1.prestamoSchema), prestamo_controller_1.createPrestamo);
// ✅ RUTAS DINÁMICAS (VAN AL FINAL)
router.post("/:id/reenganchar", prestamo_controller_1.reengancharPrestamo);
router.post("/:id/revertir-reenganche", prestamo_controller_1.revertirReenganche);
router.get("/:id", prestamo_controller_1.getPrestamoById);
router.put("/:id", prestamo_controller_1.updatePrestamo);
router.delete("/:id", prestamo_controller_1.deletePrestamo);
exports.default = router;
