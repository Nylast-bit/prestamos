import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

// /api/auth/login
router.post('/login', login);

export default router;
