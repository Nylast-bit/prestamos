// // src/routes/registroConsolidacion.routes.ts
// import { Router } from "express";
// import {
//   getAllRegistrosConsolidacion,
//   getRegistroConsolidacionById,
//   createRegistroConsolidacion,
//   updateRegistroConsolidacion,
//   deleteRegistroConsolidacion,
// } from "../controllers/registroconsolidacion.controller";
// import { validate } from "../middlewares/validate";
// import { registroConsolidacionSchema } from "../validators/registroconsolidacion.validator";

// const router = Router();

// // Rutas
// router.get("/", getAllRegistrosConsolidacion);
// router.get("/:id", getRegistroConsolidacionById);
// router.post("/", validate(registroConsolidacionSchema), createRegistroConsolidacion);
// router.put("/:id", validate(registroConsolidacionSchema), updateRegistroConsolidacion);
// router.delete("/:id", deleteRegistroConsolidacion);

// export default router;
