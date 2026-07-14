"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEmpresa = exports.updateEmpresaSuperAdmin = exports.updateEmpresa = exports.createEmpresa = exports.getEmpresas = void 0;
const logger_1 = require("../utils/logger");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const supabaseClient_1 = require("../config/supabaseClient");
const getEmpresas = async (req, res) => {
    try {
        const { data, error } = await supabaseClient_1.supabase
            .from('Empresa')
            .select('*')
            .order('IdEmpresa', { ascending: true });
        if (error)
            throw error;
        res.status(200).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getEmpresas = getEmpresas;
const createEmpresa = async (req, res) => {
    try {
        const { nombre, documento, telefono, email } = req.body;
        if (!nombre) {
            res.status(400).json({ error: 'El nombre es obligatorio' });
            return;
        }
        const { data, error } = await supabaseClient_1.supabase
            .from('Empresa')
            .insert([{ Nombre: nombre, Documento: documento, Telefono: telefono, Email: email }])
            .select()
            .single();
        if (error)
            throw error;
        // Crear automáticamente el usuario Administrador para esta empresa
        try {
            const salt = await bcryptjs_1.default.genSalt(10);
            const hashedClave = await bcryptjs_1.default.hash('admin123', salt);
            await supabaseClient_1.supabase.from('Usuario').insert([{
                    IdEmpresa: data.IdEmpresa,
                    Nombre: 'Administrador Principal',
                    Email: email,
                    Clave: hashedClave,
                    Rol: 'admin_empresa',
                    Estado: 'Activo'
                }]);
        }
        catch (adminError) {
            logger_1.logger.error("⚠️ No se pudo auto-crear el administrador:", adminError);
        }
        res.status(201).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.createEmpresa = createEmpresa;
const updateEmpresa = async (req, res) => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const info = req.body;
        const { data, error } = await supabaseClient_1.supabase
            .from('Empresa')
            .update(info)
            .eq('IdEmpresa', idEmpresa)
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
exports.updateEmpresa = updateEmpresa;
const updateEmpresaSuperAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, documento, telefono, email, estado } = req.body;
        const updateData = {};
        if (nombre !== undefined)
            updateData.Nombre = nombre;
        if (documento !== undefined)
            updateData.Documento = documento;
        if (telefono !== undefined)
            updateData.Telefono = telefono;
        if (email !== undefined)
            updateData.Email = email;
        if (estado !== undefined)
            updateData.Estado = estado;
        const { data, error } = await supabaseClient_1.supabase
            .from('Empresa')
            .update(updateData)
            .eq('IdEmpresa', id)
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
exports.updateEmpresaSuperAdmin = updateEmpresaSuperAdmin;
const deleteEmpresa = async (req, res) => {
    try {
        const { id } = req.params;
        // Limpiar jerarquía básica
        await supabaseClient_1.supabase.from('Usuario').delete().eq('IdEmpresa', id);
        await supabaseClient_1.supabase.from('Suscripcion').delete().eq('IdEmpresa', id);
        // Si hay Clientes o Préstamos, postgres arrojará un error de constraint.
        const { data, error } = await supabaseClient_1.supabase
            .from('Empresa')
            .delete()
            .eq('IdEmpresa', id)
            .select();
        if (error)
            throw error;
        res.status(200).json({ message: 'Empresa eliminada exitosamente' });
    }
    catch (err) {
        res.status(500).json({ error: 'No se puede eliminar la empresa porque contiene operaciones como Préstamos vigentes. Es mejor Desactivarla.' });
    }
};
exports.deleteEmpresa = deleteEmpresa;
