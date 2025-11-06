"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/index.ts
const express_1 = require("express");
const user_routes_1 = __importDefault(require("./user.routes"));
const prestamo_routes_1 = __importDefault(require("./prestamo.routes"));
const cliente_routes_1 = __importDefault(require("./cliente.routes"));
const gastofijo_routes_1 = __importDefault(require("./gastofijo.routes"));
const router = (0, express_1.Router)();
router.use("/users", user_routes_1.default);
router.use("/prestamos", prestamo_routes_1.default);
router.use("/clientes", cliente_routes_1.default);
router.use("/gastosfijos", gastofijo_routes_1.default);
exports.default = router;
