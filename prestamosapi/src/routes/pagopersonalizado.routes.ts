import { Router } from "express";
import { createPagoPersonalizado, getAllPagosPersonalizados } from "../controllers/pagopersonalizado.controller";

const router = Router();

// GET: /api/pagospersonalizados
router.get("/", getAllPagosPersonalizados);

// POST: /api/pagospersonalizados
router.post("/", createPagoPersonalizado);

export default router;