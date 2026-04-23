import { Router } from 'express';
import { getSuscripciones, createSuscripcion, updateSuscripcion, getDashboardStats } from '../controllers/suscripcion.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), getDashboardStats);
router.get('/', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), getSuscripciones);
router.post('/', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), createSuscripcion);
router.put('/:id', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), updateSuscripcion);

export default router;
