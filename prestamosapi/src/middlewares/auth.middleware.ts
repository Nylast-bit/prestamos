import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extendemos Request para inyectar el usuario decodificado
export interface AuthRequest extends Request {
    user?: {
        IdUsuario: string;
        IdEmpresa: number;
        Rol: string;
    };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'No autorizado. Se requiere token.' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as any;

    if (!decoded) {
        res.status(401).json({ message: 'Token inválido o expirado.' });
        return;
    }

    // Inyectamos el usuario en la request
    req.user = decoded;
    next();
};

export const requireRole = (rolesPermitidos: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
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
