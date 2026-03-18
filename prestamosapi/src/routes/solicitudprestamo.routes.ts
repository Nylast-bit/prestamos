// src/routes/solicitudPrestamo.routes.ts
import { Router } from "express";
import {
  getAllSolicitudesPrestamo,
  getSolicitudPrestamoById,
  createSolicitudPrestamo,
  updateSolicitudPrestamo,
  deleteSolicitudPrestamo,
} from "../controllers/solicitudprestamo.controller";
import { validate } from "../middlewares/validate";
import { solicitudPrestamoSchema } from "../validators/solicitudprestamo.validator";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/", getAllSolicitudesPrestamo);
router.get("/:id", getSolicitudPrestamoById);
router.post("/", validate(solicitudPrestamoSchema), createSolicitudPrestamo);
router.put("/:id", validate(solicitudPrestamoSchema), updateSolicitudPrestamo);
router.delete("/:id", deleteSolicitudPrestamo);

export default router;
