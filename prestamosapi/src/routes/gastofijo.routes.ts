// src/routes/gastosfijos.routes.ts
import { Router } from "express";
import {
  getAllGastosFijos,
  getGastoFijoById,
  createGastoFijo,
  updateGastoFijo,
  deleteGastoFijo,
} from "../controllers/gastofijo.controller";
import { 
    runFixedExpenseProcessor, 
    runCheckAndCreateConsolidation 
} from "../controllers/jobTest.controller";

const router = Router();

router.get("/", getAllGastosFijos);
router.get("/:id", getGastoFijoById);
router.post("/", createGastoFijo);
router.put("/:id", updateGastoFijo);
router.delete("/:id", deleteGastoFijo);

// --- RUTAS DE PRUEBA MANUAL (TEMPORAL) ---
// POST para ejecutar el procesamiento de gastos fijos para un ID de consolidación específico
router.post("/process-fixed-expenses/:id", runFixedExpenseProcessor); 

// POST para forzar la verificación y creación de una nueva consolidación (si es día 8 o 23)
router.post("/process-consolidation-cycle", runCheckAndCreateConsolidation);

export default router;
