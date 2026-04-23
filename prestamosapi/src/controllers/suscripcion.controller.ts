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

export const updateSuscripcion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { idPlan, estado, fechaVencimiento } = req.body;

        const updateData: any = {};
        if (idPlan !== undefined) updateData.IdPlan = idPlan;
        if (estado !== undefined) updateData.Estado = estado;
        if (fechaVencimiento !== undefined) updateData.FechaVencimiento = fechaVencimiento;

        const { data, error } = await supabase
            .from('Suscripcion')
            .update(updateData)
            .eq('IdSuscripcion', id)
            .select()
            .single();

        if (error) throw error;
        
        res.status(200).json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const { count: empresasCount } = await supabase.from('Empresa').select('*', { count: 'exact', head: true });
        const { count: planesActivosCount } = await supabase.from('Plan').select('*', { count: 'exact', head: true }).eq('Activo', true);
        
        // Count suscripciones a vencer
        const date = new Date();
        date.setDate(date.getDate() + 15);
        const { count: aVencerCount } = await supabase.from('Suscripcion').select('*', { count: 'exact', head: true }).lte('FechaVencimiento', date.toISOString());

        res.status(200).json({
            empresas: empresasCount || 0,
            planesActivos: planesActivosCount || 0,
            suscripcionesAVencer: aVencerCount || 0
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
