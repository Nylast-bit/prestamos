// src/routes/index.ts
import { Router } from "express";
// import userRoutes from "./user.routes";
import prestamoRoutes from "./prestamo.routes";
import clienteRoutes from "./cliente.routes";
import pagoRoutes from "./pago.routes";

//import gastoFijoRoutes from "./gastofijo.routes";   

const router = Router();

// router.use("/users", userRoutes);
router.use("/prestamos", prestamoRoutes);
router.use("/clientes", clienteRoutes);
router.use("/pagos", pagoRoutes);
//router.use("/gastosfijos", gastoFijoRoutes);


export default router;
