import { Router } from 'express';
import { getEmpresas, createEmpresa, updateEmpresa, updateEmpresaSuperAdmin, deleteEmpresa } from '../controllers/empresa.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Rutas de SuperAdmin
router.get('/', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), getEmpresas);
router.post('/', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), createEmpresa);
router.put('/superadmin/:id', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), updateEmpresaSuperAdmin);
router.delete('/:id', requireAuth, requireRole(['SuperAdmin', 'admin_sistema']), deleteEmpresa);

// Rutas de configuración de la Empresa local
router.put('/', requireAuth, requireRole(['SuperAdmin', 'AdminEmpresa', 'admin_empresa', 'Admin', 'admin_sistema']), updateEmpresa);

export default router;
