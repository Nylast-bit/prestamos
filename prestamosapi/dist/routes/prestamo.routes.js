"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prestamo_controller_1 = require("../controllers/prestamo.controller");
const validate_1 = require("../middlewares/validate");
const prestamo_validator_1 = require("../validators/prestamo.validator");
const router = (0, express_1.Router)();
router.get("/", prestamo_controller_1.getPrestamos);
router.get("/:id", prestamo_controller_1.getPrestamoById);
router.post("/", (0, validate_1.validate)(prestamo_validator_1.prestamoSchema), prestamo_controller_1.createPrestamo);
router.put("/:id", (0, validate_1.validate)(prestamo_validator_1.prestamoSchema.partial()), prestamo_controller_1.updatePrestamo); // .partial() porque en update no es obligatorio todo
router.delete("/:id", prestamo_controller_1.deletePrestamo);
router.get("/:id/eliminar-info", prestamo_controller_1.getPrestamoParaEliminar);
router.post("/simular", prestamo_controller_1.simularPrestamo);
router.post("/simular/opcionescapitalinteres", prestamo_controller_1.opcionesSimularPrestamoCapitalInteres);
router.post('/calcular-tasa-por-cuota', prestamo_controller_1.calcularTasaPorCuota);
exports.default = router;
