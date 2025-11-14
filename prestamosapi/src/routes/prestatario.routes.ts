// // src/routes/cliente.routes.ts
// import { Router } from "express";
// import {
//   getAllPrestatarios,
//   getPrestatarioById,
//   createPrestatario,
//   updatePrestatario,
//   deletePrestatario,
// } from "../controllers/prestatario.controller";
// import { validate } from "../middlewares/validate";
// import { prestatarioSchema } from "../validators/prestatario.validator";

// const router = Router();

// router.get("/", getAllPrestatarios);
// router.get("/:id", getPrestatarioById);
// router.post("/", validate(prestatarioSchema), createPrestatario);
// router.put("/:id", validate(prestatarioSchema), updatePrestatario);
// router.delete("/:id", deletePrestatario);

// export default router;
