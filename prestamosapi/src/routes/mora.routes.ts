import { Router } from "express";
import {
  calcularMora,
  perdonarMora,
  getHistorialMora,
  getMorasPendientes,
  verificarMoraCliente
} from "../controllers/mora.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);

router.post("/calcular/:idPrestamo", calcularMora);
router.post("/perdonar/:idPrestamo", perdonarMora);
router.get("/historial/:idPrestamo", getHistorialMora);
router.get("/pendientes", getMorasPendientes);
router.get("/verificar-cliente/:idCliente", verificarMoraCliente);

export default router;
