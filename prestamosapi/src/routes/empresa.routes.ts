import { Router } from 'express';
import { getEmpresas, createEmpresa } from '../controllers/empresa.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Solo el SuperAdmin puede ver todas o crear nuevas empresas.
router.get('/', requireAuth, requireRole(['SuperAdmin']), getEmpresas);
router.post('/', requireAuth, requireRole(['SuperAdmin']), createEmpresa);

export default router;
