"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCliente = exports.updateCliente = exports.createCliente = exports.getClienteById = exports.getAllClientes = void 0;
// 1. ELIMINAMOS PRISMA
// import prisma from "../prisma/client"; 
// 2. IMPORTAMOS EL NUEVO CLIENTE SUPABASE
const supabaseClient_1 = require("../config/supabaseClient");
// Asumimos que tu tabla en Supabase se llama 'cliente'
const CLIENT_TABLE_NAME = 'Cliente';
const getAllClientes = async (req, res, next) => {
    try {
        // ASÍ ES CON SUPABASE:
        const { data: clientes, error } = await supabaseClient_1.supabaseAdmin
            .from(CLIENT_TABLE_NAME)
            .select('*'); // Trae todas las columnas
        if (error)
            throw error; // Lanza el error para que lo atrape el catch
        res.json(clientes);
    }
    catch (err) {
        next(err);
    }
};
exports.getAllClientes = getAllClientes;
const getClienteById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { data: cliente, error } = await supabaseClient_1.supabaseAdmin
            .from(CLIENT_TABLE_NAME)
            .select('*')
            .eq('IdCliente', id) // Asumiendo que tu columna se llama 'IdCliente'
            .single(); // .single() trae solo 1 objeto (o null)
        if (error)
            throw error;
        if (!cliente)
            return res.status(404).json({ error: "Cliente no encontrado" });
        res.json(cliente);
    }
    catch (err) {
        next(err);
    }
};
exports.getClienteById = getClienteById;
const createCliente = async (req, res, next) => {
    try {
        const data = req.body;
        // ASÍ ES CON SUPABASE:
        const { data: nuevoCliente, error } = await supabaseClient_1.supabaseAdmin
            .from(CLIENT_TABLE_NAME)
            .insert(data)
            .select() // .select() hace que te devuelva el objeto creado
            .single(); // Devuelve solo el objeto, no un array
        if (error)
            throw error;
        res.status(201).json(nuevoCliente);
    }
    catch (err) {
        next(err);
    }
};
exports.createCliente = createCliente;
const updateCliente = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const data = req.body;
        // ASÍ ES CON SUPABASE:
        const { data: clienteActualizado, error } = await supabaseClient_1.supabaseAdmin
            .from(CLIENT_TABLE_NAME)
            .update(data) // 1. Los datos a actualizar
            .eq('IdCliente', id) // 2. El 'WHERE' (dónde actualizar)
            .select() // 3. Devuelve el registro actualizado
            .single(); // 4. Devuelve solo un objeto
        if (error)
            throw error;
        if (!clienteActualizado)
            return res.status(404).json({ error: "Cliente no encontrado" });
        res.json(clienteActualizado);
    }
    catch (err) {
        next(err);
    }
};
exports.updateCliente = updateCliente;
const deleteCliente = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        // ASÍ ES CON SUPABASE:
        const { error, data } = await supabaseClient_1.supabaseAdmin
            .from(CLIENT_TABLE_NAME)
            .delete() // 1. El comando 'DELETE'
            .eq('IdCliente', id) // 2. El 'WHERE' (cuál borrar)
            .select(); // 3. (Opcional) Devuelve el objeto borrado
        if (error)
            throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ error: "Cliente no encontrado para eliminar" });
        }
        res.json({ message: "Cliente eliminado" });
    }
    catch (err) {
        next(err);
    }
};
exports.deleteCliente = deleteCliente;
