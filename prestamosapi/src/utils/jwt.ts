import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_development_only';

export const generateToken = (payload: { IdUsuario: string, IdEmpresa: number, Rol: string }) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: '1d' // El token expira en 1 día
    });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null; // Token inválido o expirado
    }
};
