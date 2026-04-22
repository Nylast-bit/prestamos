import { Router } from 'express';
import { getSuscripciones, createSuscripcion } from '../controllers/suscripcion.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Superadmin o admins podrian ver. Vamos a limitarlo a SuperAdmin por ahora o permitir a Admin ver la suya
router.get('/', requireAuth, requireRole(['SuperAdmin']), getSuscripciones);
router.post('/', requireAuth, requireRole(['SuperAdmin']), createSuscripcion);

export default router;
