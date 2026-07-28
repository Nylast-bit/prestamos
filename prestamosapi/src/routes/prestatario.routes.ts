import { Router } from "express";
import {
  getAllPrestatarios,
  getPrestatarioById,
  createPrestatario,
  updatePrestatario,
  deletePrestatario,
  toggleEstadoPrestatario,
  getMyProfile,
  updateMyProfile,
} from "../controllers/prestatario.controller";
import { validate } from "../middlewares/validate";
import { prestatarioSchema } from "../validators/prestatario.validator";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

// Perfil propio (MUST be before /:id to avoid conflict)
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);

router.get("/", getAllPrestatarios);
router.get("/:id", getPrestatarioById);
router.post("/", validate(prestatarioSchema), createPrestatario);
router.put("/:id", validate(prestatarioSchema), updatePrestatario);
router.delete("/:id", deletePrestatario);
router.patch("/:id/toggle-estado", toggleEstadoPrestatario);

export default router;
