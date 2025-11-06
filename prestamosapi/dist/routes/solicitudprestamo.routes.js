"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/solicitudPrestamo.routes.ts
const express_1 = require("express");
const solicitudprestamo_controller_1 = require("../controllers/solicitudprestamo.controller");
const validate_1 = require("../middlewares/validate");
const solicitudprestamo_validator_1 = require("../validators/solicitudprestamo.validator");
const router = (0, express_1.Router)();
router.get("/", solicitudprestamo_controller_1.getAllSolicitudesPrestamo);
router.get("/:id", solicitudprestamo_controller_1.getSolicitudPrestamoById);
router.post("/", (0, validate_1.validate)(solicitudprestamo_validator_1.solicitudPrestamoSchema), solicitudprestamo_controller_1.createSolicitudPrestamo);
router.put("/:id", (0, validate_1.validate)(solicitudprestamo_validator_1.solicitudPrestamoSchema), solicitudprestamo_controller_1.updateSolicitudPrestamo);
router.delete("/:id", solicitudprestamo_controller_1.deleteSolicitudPrestamo);
exports.default = router;
