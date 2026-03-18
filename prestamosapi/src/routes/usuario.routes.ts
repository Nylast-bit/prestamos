import { Router } from 'express';
import { getUsuariosPorEmpresa, createUsuario } from '../controllers/usuario.controller';
import { requireAuth, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// Protegido: Solo SuperAdmin o AdminEmpresa pueden manejar usuarios de sistema
router.get('/', requireAuth, requireRole(['SuperAdmin', 'AdminEmpresa']), getUsuariosPorEmpresa);
router.post('/', requireAuth, requireRole(['SuperAdmin', 'AdminEmpresa']), createUsuario);

export default router;
