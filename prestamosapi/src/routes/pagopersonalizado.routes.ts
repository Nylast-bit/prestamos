import { Router } from "express";
import { createPagoPersonalizado, getAllPagosPersonalizados } from "../controllers/pagopersonalizado.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

// GET: /api/pagospersonalizados
router.get("/", getAllPagosPersonalizados);

// POST: /api/pagospersonalizados
router.post("/", createPagoPersonalizado);

export default router;