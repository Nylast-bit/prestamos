"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/gastosfijos.routes.ts
const express_1 = require("express");
const gastofijo_controller_1 = require("../controllers/gastofijo.controller");
const router = (0, express_1.Router)();
router.get("/", gastofijo_controller_1.getAllGastosFijos);
router.get("/:id", gastofijo_controller_1.getGastoFijoById);
router.post("/", gastofijo_controller_1.createGastoFijo);
router.put("/:id", gastofijo_controller_1.updateGastoFijo);
router.delete("/:id", gastofijo_controller_1.deleteGastoFijo);
exports.default = router;
