"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/pago.routes.ts
const express_1 = require("express");
const pago_controller_1 = require("../controllers/pago.controller");
const validate_1 = require("../middlewares/validate");
const pago_validator_1 = require("../validators/pago.validator");
const router = (0, express_1.Router)();
router.get("/", pago_controller_1.getAllPagos);
router.get("/:id", pago_controller_1.getPagoById);
router.post("/", (0, validate_1.validate)(pago_validator_1.pagoAutomaticoSchema), pago_controller_1.createPago);
router.post("/:id/proxima-cuota", pago_controller_1.getProximaCuota);
router.put("/:id", (0, validate_1.validate)(pago_validator_1.pagoSchema.partial()), pago_controller_1.updatePago); // .partial() porque en update no es obligatorio enviar todos los campos
router.delete("/:id", pago_controller_1.deletePago);
exports.default = router;
