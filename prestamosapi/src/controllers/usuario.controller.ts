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

        // Hashear password
        const salt = await bcrypt.genSalt(10);
        const hashedClave = await bcrypt.hash(clave, salt);

        const { data, error } = await supabase
            .from('Usuario')
            .insert([{
                Nombre: nombre,
                Email: email,
                Clave: hashedClave,
                Rol: rol || 'Cajero', // Rol por defecto si no se pasa
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
