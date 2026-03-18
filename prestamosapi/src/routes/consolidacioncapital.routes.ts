// src/routes/consolidacionCapital.routes.ts
import { Router } from "express";
import {
  getAllConsolidacionesCapital,
  getConsolidacionCapitalById,
  createConsolidacionCapital,
  updateConsolidacionCapital,
  deleteConsolidacionCapital,
  getResumenConsolidacionActiva,
} from "../controllers/consolidacioncapital.controller";
import { validate } from "../middlewares/validate";
import { consolidacionCapitalSchema } from "../validators/consolidacioncapital.validator";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", getAllConsolidacionesCapital);
router.get("/activa", getResumenConsolidacionActiva);
router.get("/:id", getConsolidacionCapitalById);
router.post("/", validate(consolidacionCapitalSchema), createConsolidacionCapital);
router.put("/:id", validate(consolidacionCapitalSchema), updateConsolidacionCapital);
router.delete("/:id", deleteConsolidacionCapital);

export default router;
