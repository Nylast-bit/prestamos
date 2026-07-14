"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No autorizado. Se requiere token.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
        return;
    }
    // Inyectamos el usuario en la request
    req.user = decoded;
    next();
};
exports.requireAuth = requireAuth;
const requireRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ message: 'No autorizado.' });
            return;
        }
        if (!rolesPermitidos.includes(req.user.Rol)) {
            res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
