import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

export const getPlanes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabase
            .from('Plan')
            .select('*')
            .order('IdPlan', { ascending: true });

        if (error) throw error;

        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre, precio, limiteUsuarios, limitePrestamos } = req.body;

        if (!nombre) {
            res.status(400).json({ error: 'El nombre es obligatorio' });
            return;
        }

        const { data, error } = await supabase
            .from('Plan')
            .insert([{ 
                Nombre: nombre, 
                Precio: precio || 0, 
                LimiteUsuarios: limiteUsuarios || 5, 
                LimitePrestamos: limitePrestamos || 50,
                Activo: true 
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
