"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_controller_1 = require("../controllers/usuario.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protegido: Solo SuperAdmin o AdminEmpresa pueden manejar usuarios de sistema
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema', 'AdminEmpresa', 'admin_empresa']), usuario_controller_1.getUsuariosPorEmpresa);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema', 'AdminEmpresa', 'admin_empresa']), usuario_controller_1.createUsuario);
exports.default = router;
