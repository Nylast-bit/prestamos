import { Router } from 'express';
import { getEmpresas, createEmpresa, updateEmpresa } from '../controllers/empresa.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Rutas de SuperAdmin
router.get('/', requireAuth, requireRole(['SuperAdmin']), getEmpresas);
router.post('/', requireAuth, requireRole(['SuperAdmin']), createEmpresa);

// Rutas de configuración de la Empresa local
router.put('/', requireAuth, requireRole(['SuperAdmin', 'AdminEmpresa', 'admin_empresa', 'Admin', 'admin_sistema']), updateEmpresa);

export default router;
