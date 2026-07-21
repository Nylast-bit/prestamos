import { Router } from 'express';
import { login, sendOtp, verifyOtp } from '../controllers/auth.controller';

const router = Router();

// /api/auth/login
router.post('/login', login);

// /api/auth/send-otp y /api/auth/verify-otp
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

export default router;
