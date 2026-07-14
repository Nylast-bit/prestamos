"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGastoFijoService = exports.updateGastoFijoService = exports.getGastoFijoByIdService = exports.getAllGastosFijosService = exports.createGastoFijoService = void 0;
const logger_1 = require("../utils/logger");
// src/services/gastoFijo.service.ts
const supabaseClient_1 = require("../config/supabaseClient");
// --- CREAR ---
const createGastoFijoService = async (data) => {
    const { data: nuevo, error } = await supabaseClient_1.supabase
        .from("GastoFijo")
        .insert(data)
        .select()
        .single();
    if (error) {
        logger_1.logger.error("Error en createGastoFijoService:", error.message);
        throw new Error(`Error creando gasto fijo: ${error.message}`);
    }
    return nuevo;
};
exports.createGastoFijoService = createGastoFijoService;
// --- OBTENER TODOS ---
const getAllGastosFijosService = async (idEmpresa) => {
    const { data: lista, error } = await supabaseClient_1.supabase
        .from("GastoFijo")
        .select("*")
        .eq('IdEmpresa', idEmpresa);
    if (error) {
        logger_1.logger.error("Error en getAllGastosFijosService:", error.message);
        throw new Error(`Error obteniendo gastos fijos: ${error.message}`);
    }
    return lista;
};
exports.getAllGastosFijosService = getAllGastosFijosService;
// --- OBTENER POR ID ---
const getGastoFijoByIdService = async (id, idEmpresa) => {
    const { data: gasto, error } = await supabaseClient_1.supabase
        .from("GastoFijo")
        .select("*")
        .eq("IdGasto", id)
        .eq("IdEmpresa", idEmpresa)
        .maybeSingle();
    if (error) {
        throw new Error(`Error de BBDD al buscar gasto: ${error.message}`);
    }
    if (!gasto) {
        throw new Error("Gasto fijo no encontrado");
    }
    return gasto;
};
exports.getGastoFijoByIdService = getGastoFijoByIdService;
// --- ACTUALIZAR ---
const updateGastoFijoService = async (id, idEmpresa, data) => {
    const { data: actualizado, error } = await supabaseClient_1.supabase
        .from("GastoFijo")
        .update(data)
        .eq("IdGasto", id)
        .eq("IdEmpresa", idEmpresa)
        .select()
        .single();
    if (error) {
        logger_1.logger.error("Error en updateGastoFijoService:", error.message);
        throw new Error(`Error actualizando gasto fijo: ${error.message}`);
    }
    if (!actualizado) {
        throw new Error("Gasto fijo no encontrado para actualizar");
    }
    return actualizado;
};
exports.updateGastoFijoService = updateGastoFijoService;
// --- ELIMINAR ---
const deleteGastoFijoService = async (id, idEmpresa) => {
    // Nota: Si hay registros en GastoFijoRegistro, la BBDD impedirá esto si no hay CASCADE.
    const { error } = await supabaseClient_1.supabase
        .from("GastoFijo")
        .delete()
        .eq("IdGasto", id)
        .eq("IdEmpresa", idEmpresa);
    if (error) {
        logger_1.logger.error("Error en deleteGastoFijoService:", error.message);
        throw new Error(`Error eliminando gasto fijo: ${error.message}`);
    }
    return { message: "Gasto fijo eliminado" };
};
exports.deleteGastoFijoService = deleteGastoFijoService;
