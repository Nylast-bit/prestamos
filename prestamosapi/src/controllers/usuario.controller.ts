import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient';

export const getUsuariosPorEmpresa = async (req: any, res: Response): Promise<void> => {
    try {
        const idEmpresa = req.user.IdEmpresa;

        // Solo permitir que un admin de empresa vea a sus usuarios (o SuperAdmin)
        let query = supabase.from('Usuario').select('IdUsuario, Nombre, Email, Rol, Estado, FechaRegistro');

        if (req.user.Rol !== 'SuperAdmin') {
            query = query.eq('IdEmpresa', idEmpresa);
        }

        const { data, error } = await query.order('FechaRegistro', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createUsuario = async (req: any, res: Response): Promise<void> => {
    try {
        const { nombre, email, clave, rol, idEmpresa } = req.body;

        // Determinar qué empresa asignar
        // Si el que crea es SuperAdmin, puede pasar idEmpresa. Si es AdminEmpresa, forzosamente es su empresa.
        const targetEmpresa = req.user.Rol === 'SuperAdmin' ? (idEmpresa || req.user.IdEmpresa) : req.user.IdEmpresa;

        if (!nombre || !email || !clave) {
            res.status(400).json({ error: 'Nombre, email y clave son obligatorios' });
            return;
        }

        // Validar límites de usuarios basados en el Plan y si la suscripción está activa
        if (req.user.Rol !== 'SuperAdmin') {
            const { data: suscripcion } = await supabase
                .from('Suscripcion')
                .select('Plan:IdPlan (LimiteUsuarios)')
                .eq('IdEmpresa', targetEmpresa)
                .eq('Estado', 'Activa')
                .order('IdSuscripcion', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (!suscripcion || !suscripcion.Plan) {
                res.status(403).json({ error: 'La empresa no cuenta con una suscripción activa.' });
                return;
            }

            const plan = Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan;

            const { count, error: countError } = await supabase
                .from('Usuario')
                .select('*', { count: 'exact', head: true })
                .eq('IdEmpresa', targetEmpresa);

            if (countError) throw countError;

            if ((count || 0) >= plan.LimiteUsuarios) {
                res.status(403).json({ error: 'Se ha alcanzado el límite de usuarios de su plan actual.' });
                return;
            }
        }

        // Hashear password
        const salt = await bcrypt.genSalt(10);
        const hashedClave = await bcrypt.hash(clave, salt);

        const { data, error } = await supabase
            .from('Usuario')
            .insert([{
                Nombre: nombre,
                Email: email,
                Clave: hashedClave,
                Rol: rol || 'Prestamista', // Rol por defecto

                IdEmpresa: targetEmpresa
            }])
            .select('IdUsuario, Nombre, Email, Rol, Estado, IdEmpresa')
            .single();

        if (error) {
            if (error.code === '23505') { // Violación de unicidad (email)
                res.status(400).json({ error: 'El email ya está registrado' });
                return;
            }
            throw error;
        }

        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
