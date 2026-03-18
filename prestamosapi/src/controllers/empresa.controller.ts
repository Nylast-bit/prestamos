import { Request, Response } from 'express';
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

        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
