"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlan = exports.createPlan = exports.getPlanes = void 0;
const supabaseClient_1 = require("../config/supabaseClient");
const getPlanes = async (req, res) => {
    try {
        const { data, error } = await supabaseClient_1.supabase
            .from('Plan')
            .select('*')
            .order('IdPlan', { ascending: true });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getPlanes = getPlanes;
const createPlan = async (req, res) => {
    try {
        const { nombre, precio, limiteUsuarios, limitePrestamos } = req.body;
        if (!nombre) {
            res.status(400).json({ error: 'El nombre es obligatorio' });
            return;
        }
        const { data, error } = await supabaseClient_1.supabase
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
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createPlan = createPlan;
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, limiteUsuarios, limitePrestamos, activo } = req.body;
        const updateData = {};
        if (nombre !== undefined)
            updateData.Nombre = nombre;
        if (precio !== undefined)
            updateData.Precio = precio;
        if (limiteUsuarios !== undefined)
            updateData.LimiteUsuarios = limiteUsuarios;
        if (limitePrestamos !== undefined)
            updateData.LimitePrestamos = limitePrestamos;
        if (activo !== undefined)
            updateData.Activo = activo;
        const { data, error } = await supabaseClient_1.supabase
            .from('Plan')
            .update(updateData)
            .eq('IdPlan', id)
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
exports.updatePlan = updatePlan;
