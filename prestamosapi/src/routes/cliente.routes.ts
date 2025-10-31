// src/routes/cliente.routes.ts
import { Router } from "express";
import {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../controllers/cliente.controller";
import { validate } from "../middlewares/validate";
import { clienteSchema } from "../validators/cliente.validator";

const router = Router();

router.get("/", getAllClientes);
router.get("/:id", getClienteById);
router.post("/", validate(clienteSchema), createCliente);
router.put("/:id", validate(clienteSchema), updateCliente);
router.delete("/:id", deleteCliente);

export default router;
