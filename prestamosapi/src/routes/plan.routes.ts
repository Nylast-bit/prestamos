import { Router } from 'express';
import { getPlanes, createPlan } from '../controllers/plan.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Solo superadmin puede gestionar los planes
router.get('/', requireAuth, requireRole(['SuperAdmin']), getPlanes);
router.post('/', requireAuth, requireRole(['SuperAdmin']), createPlan);

export default router;
