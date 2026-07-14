"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_development_only';
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
        expiresIn: '1d' // El token expira en 1 día
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null; // Token inválido o expirado
    }
};
exports.verifyToken = verifyToken;
