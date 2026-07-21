"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// /api/auth/login
router.post('/login', auth_controller_1.login);
// /api/auth/send-otp y /api/auth/verify-otp
router.post('/send-otp', auth_controller_1.sendOtp);
router.post('/verify-otp', auth_controller_1.verifyOtp);
exports.default = router;
