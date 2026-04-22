import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const getSuscripciones = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('Suscripcion')
            .select(`
                *,
                Empresa:IdEmpresa (Nombre),
                Plan:IdPlan (Nombre, LimiteUsuarios, LimitePrestamos)
            `)
            .order('IdSuscripcion', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createSuscripcion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idEmpresa, idPlan, fechaVencimiento } = req.body;

        if (!idEmpresa || !idPlan || !fechaVencimiento) {
            res.status(400).json({ error: 'Faltan campos obligatorios' });
            return;
        }

        const { data, error } = await supabase
            .from('Suscripcion')
            .insert([{ 
                IdEmpresa: idEmpresa, 
                IdPlan: idPlan, 
                FechaVencimiento: fechaVencimiento,
                Estado: 'Activa' 
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
