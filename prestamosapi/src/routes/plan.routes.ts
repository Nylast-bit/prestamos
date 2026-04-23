import { Router } from 'express';
import { getPlanes, createPlan, updatePlan } from '../controllers/plan.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Solo superadmin puede gestionar los planes
router.get('/', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), getPlanes);
router.post('/', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), createPlan);
router.put('/:id', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), updatePlan);

export default router;
