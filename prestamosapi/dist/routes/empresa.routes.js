"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const empresa_controller_1 = require("../controllers/empresa.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Rutas de SuperAdmin
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema']), empresa_controller_1.getEmpresas);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema']), empresa_controller_1.createEmpresa);
router.put('/superadmin/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema']), empresa_controller_1.updateEmpresaSuperAdmin);
router.delete('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema']), empresa_controller_1.deleteEmpresa);
// Rutas de configuración de la Empresa local
router.put('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'AdminEmpresa', 'admin_empresa', 'Admin', 'admin_sistema']), empresa_controller_1.updateEmpresa);
exports.default = router;
