"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/cliente.routes.ts
const express_1 = require("express");
const cliente_controller_1 = require("../controllers/cliente.controller");
const validate_1 = require("../middlewares/validate");
const cliente_validator_1 = require("../validators/cliente.validator");
const router = (0, express_1.Router)();
router.get("/", cliente_controller_1.getAllClientes);
router.get("/:id", cliente_controller_1.getClienteById);
router.post("/", (0, validate_1.validate)(cliente_validator_1.clienteSchema), cliente_controller_1.createCliente);
router.put("/:id", (0, validate_1.validate)(cliente_validator_1.clienteSchema), cliente_controller_1.updateCliente);
router.delete("/:id", cliente_controller_1.deleteCliente);
exports.default = router;
