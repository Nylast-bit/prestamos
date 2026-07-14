"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const plan_controller_1 = require("../controllers/plan.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Solo superadmin puede gestionar los planes
router.get('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema']), plan_controller_1.getPlanes);
router.post('/', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema']), plan_controller_1.createPlan);
router.put('/:id', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(['SuperAdmin', 'admin_sistema']), plan_controller_1.updatePlan);
exports.default = router;
