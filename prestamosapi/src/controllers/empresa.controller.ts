import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabaseClient';

export const getEmpresas = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('Empresa')
            .select('*')
            .order('IdEmpresa', { ascending: true });

        if (error) throw error;

        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createEmpresa = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, documento, telefono, email } = req.body;

        if (!nombre) {
            res.status(400).json({ error: 'El nombre es obligatorio' });
            return;
        }

        const { data, error } = await supabase
            .from('Empresa')
            .insert([{ Nombre: nombre, Documento: documento, Telefono: telefono, Email: email }])
            .select()
            .single();

        if (error) throw error;

        // Crear automáticamente el usuario Administrador para esta empresa
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedClave = await bcrypt.hash('admin123', salt);

            await supabase.from('Usuario').insert([{
                IdEmpresa: data.IdEmpresa,
                Nombre: 'Administrador Principal',
                Email: email,
                Clave: hashedClave,
                Rol: 'admin_empresa',
                Estado: 'Activo'
            }]);
        } catch (adminError) {
            console.error("⚠️ No se pudo auto-crear el administrador:", adminError);
        }

        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateEmpresa = async (req: any, res: Response): Promise<void> => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const info = req.body;
        
        const { data, error } = await supabase
            .from('Empresa')
            .update(info)
            .eq('IdEmpresa', idEmpresa)
            .select()
            .single();

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const updateEmpresaSuperAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nombre, documento, telefono, email, estado } = req.body;

        const updateData: any = {};
        if (nombre !== undefined) updateData.Nombre = nombre;
        if (documento !== undefined) updateData.Documento = documento;
        if (telefono !== undefined) updateData.Telefono = telefono;
        if (email !== undefined) updateData.Email = email;
        if (estado !== undefined) updateData.Estado = estado;

        const { data, error } = await supabase
            .from('Empresa')
            .update(updateData)
            .eq('IdEmpresa', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const deleteEmpresa = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Limpiar jerarquía básica
        await supabase.from('Usuario').delete().eq('IdEmpresa', id);
        await supabase.from('Suscripcion').delete().eq('IdEmpresa', id);
        // Si hay Clientes o Préstamos, postgres arrojará un error de constraint.

        const { data, error } = await supabase
            .from('Empresa')
            .delete()
            .eq('IdEmpresa', id)
            .select();

        if (error) throw error;
        res.status(200).json({ message: 'Empresa eliminada exitosamente' });
    } catch (err: any) {
        res.status(500).json({ error: 'No se puede eliminar la empresa porque contiene operaciones como Préstamos vigentes. Es mejor Desactivarla.' });
    }
};
