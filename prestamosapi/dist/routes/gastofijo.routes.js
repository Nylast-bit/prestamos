"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/gastosfijos.routes.ts
const express_1 = require("express");
const gastofijo_controller_1 = require("../controllers/gastofijo.controller");
const jobTest_controller_1 = require("../controllers/jobTest.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.get("/", gastofijo_controller_1.getAllGastosFijos);
router.get("/:id", gastofijo_controller_1.getGastoFijoById);
router.post("/", gastofijo_controller_1.createGastoFijo);
router.put("/:id", gastofijo_controller_1.updateGastoFijo);
router.delete("/:id", gastofijo_controller_1.deleteGastoFijo);
// --- RUTAS DE PRUEBA MANUAL (TEMPORAL) ---
// POST para ejecutar el procesamiento de gastos fijos para un ID de consolidación específico
router.post("/process-fixed-expenses/:id", jobTest_controller_1.runFixedExpenseProcessor);
// POST para forzar la verificación y creación de una nueva consolidación (si es día 8 o 23)
router.post("/process-consolidation-cycle", jobTest_controller_1.runCheckAndCreateConsolidation);
exports.default = router;
