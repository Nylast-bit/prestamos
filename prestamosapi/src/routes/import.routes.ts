import { Router } from "express";
import { importBatch, exportAll } from "../controllers/import.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/", importBatch);
router.get("/export", exportAll);

export default router;
