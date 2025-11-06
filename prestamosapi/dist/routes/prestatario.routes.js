"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente.routes.ts
const express_1 = require("express");
const prestatario_controller_1 = require("../controllers/prestatario.controller");
const validate_1 = require("../middlewares/validate");
const prestatario_validator_1 = require("../validators/prestatario.validator");
const router = (0, express_1.Router)();
router.get("/", prestatario_controller_1.getAllPrestatarios);
router.get("/:id", prestatario_controller_1.getPrestatarioById);
router.post("/", (0, validate_1.validate)(prestatario_validator_1.prestatarioSchema), prestatario_controller_1.createPrestatario);
router.put("/:id", (0, validate_1.validate)(prestatario_validator_1.prestatarioSchema), prestatario_controller_1.updatePrestatario);
router.delete("/:id", prestatario_controller_1.deletePrestatario);
exports.default = router;
