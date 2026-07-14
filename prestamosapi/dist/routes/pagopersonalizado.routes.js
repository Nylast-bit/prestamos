"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pagopersonalizado_controller_1 = require("../controllers/pagopersonalizado.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
// GET: /api/pagospersonalizados
router.get("/", pagopersonalizado_controller_1.getAllPagosPersonalizados);
// POST: /api/pagospersonalizados
router.post("/", pagopersonalizado_controller_1.createPagoPersonalizado);
exports.default = router;
