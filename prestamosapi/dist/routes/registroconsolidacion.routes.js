"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/registroConsolidacion.routes.ts
const express_1 = require("express");
const registroconsolidacion_controller_1 = require("../controllers/registroconsolidacion.controller");
const validate_1 = require("../middlewares/validate");
const registroconsolidacion_validator_1 = require("../validators/registroconsolidacion.validator");
const router = (0, express_1.Router)();
// Rutas
router.get("/", registroconsolidacion_controller_1.getAllRegistrosConsolidacion);
router.get("/:id", registroconsolidacion_controller_1.getRegistroConsolidacionById);
router.post("/", (0, validate_1.validate)(registroconsolidacion_validator_1.registroConsolidacionSchema), registroconsolidacion_controller_1.createRegistroConsolidacion);
router.put("/:id", (0, validate_1.validate)(registroconsolidacion_validator_1.registroConsolidacionSchema), registroconsolidacion_controller_1.updateRegistroConsolidacion);
router.delete("/:id", registroconsolidacion_controller_1.deleteRegistroConsolidacion);
exports.default = router;
