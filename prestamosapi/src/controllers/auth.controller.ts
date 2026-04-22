import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient';
import { generateToken } from '../utils/jwt';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email y contraseña son requeridos' });
            return;
        }

        // Buscar usuario en DB
        const { data: usuario, error } = await supabase
            .from('Usuario')
            .select('*')
            .eq('Email', email)
            .single();

        if (error || !usuario) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        if (usuario.Estado !== 'Activo') {
            res.status(403).json({ error: 'El usuario está inactivo o suspendido' });
            return;
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, usuario.Clave);

        if (!isMatch) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        // Buscar la empresa relacionada para traer el nombre
        const { data: empresa } = await supabase
            .from('Empresa')
            .select('Nombre, ColorFondo, Icono')
            .eq('IdEmpresa', usuario.IdEmpresa)
            .single();

        // Buscar plan activo
        const { data: suscripcion } = await supabase
            .from('Suscripcion')
            .select(`
                FechaVencimiento,
                Estado,
                Plan:IdPlan (LimiteUsuarios, LimitePrestamos, Nombre)
            `)
            .eq('IdEmpresa', usuario.IdEmpresa)
            .eq('Estado', 'Activa')
            .order('IdSuscripcion', { ascending: false })
            .limit(1)
            .maybeSingle();

        // Generar Token JWT
        const token = generateToken({
            IdUsuario: usuario.IdUsuario,
            IdEmpresa: usuario.IdEmpresa,
            Rol: usuario.Rol
        });

        res.status(200).json({
            message: 'Autenticación exitosa',
            token,
            user: {
                id: usuario.IdUsuario,
                nombre: usuario.Nombre,
                email: usuario.Email,
                rol: usuario.Rol,
                idEmpresa: usuario.IdEmpresa,
                nombreEmpresa: empresa ? empresa.Nombre : 'Desconocida',
                colorFondo: empresa?.ColorFondo || '#213685',
                iconoEmpresa: empresa?.Icono || 'Building2',
                suscripcion: suscripcion ? {
                    fechaVencimiento: suscripcion.FechaVencimiento,
                    plan: Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan
                } : null
            }
        });

    } catch (err: any) {
        res.status(500).json({ error: 'Error interno de servidor', details: err.message });
    }
};
