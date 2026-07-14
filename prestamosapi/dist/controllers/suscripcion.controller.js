"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.updateSuscripcion = exports.createSuscripcion = exports.getSuscripciones = void 0;
const supabaseClient_1 = require("../config/supabaseClient");
const getSuscripciones = async (req, res) => {
    try {
        const { data, error } = await supabaseClient_1.supabase
            .from('Suscripcion')
            .select(`
                *,
                Empresa:IdEmpresa (Nombre),
                Plan:IdPlan (Nombre, LimiteUsuarios, LimitePrestamos)
            `)
            .order('IdSuscripcion', { ascending: false });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getSuscripciones = getSuscripciones;
const createSuscripcion = async (req, res) => {
    try {
        const { idEmpresa, idPlan, fechaVencimiento } = req.body;
        if (!idEmpresa || !idPlan || !fechaVencimiento) {
            res.status(400).json({ error: 'Faltan campos obligatorios' });
            return;
        }
        const { data, error } = await supabaseClient_1.supabase
            .from('Suscripcion')
            .insert([{
                IdEmpresa: idEmpresa,
                IdPlan: idPlan,
                FechaVencimiento: fechaVencimiento,
                Estado: 'Activa'
            }])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createSuscripcion = createSuscripcion;
const updateSuscripcion = async (req, res) => {
    try {
        const { id } = req.params;
        const { idPlan, estado, fechaVencimiento } = req.body;
        const updateData = {};
        if (idPlan !== undefined)
            updateData.IdPlan = idPlan;
        if (estado !== undefined)
            updateData.Estado = estado;
        if (fechaVencimiento !== undefined)
            updateData.FechaVencimiento = fechaVencimiento;
        const { data, error } = await supabaseClient_1.supabase
            .from('Suscripcion')
            .update(updateData)
            .eq('IdSuscripcion', id)
            .select()
            .single();
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.updateSuscripcion = updateSuscripcion;
const getDashboardStats = async (req, res) => {
    try {
        const { count: empresasCount } = await supabaseClient_1.supabase.from('Empresa').select('*', { count: 'exact', head: true });
        const { count: planesActivosCount } = await supabaseClient_1.supabase.from('Plan').select('*', { count: 'exact', head: true }).eq('Activo', true);
        // Count suscripciones a vencer
        const date = new Date();
        date.setDate(date.getDate() + 15);
        const { count: aVencerCount } = await supabaseClient_1.supabase.from('Suscripcion').select('*', { count: 'exact', head: true }).lte('FechaVencimiento', date.toISOString());
        res.status(200).json({
            empresas: empresasCount || 0,
            planesActivos: planesActivosCount || 0,
            suscripcionesAVencer: aVencerCount || 0
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getDashboardStats = getDashboardStats;
