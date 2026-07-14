"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistroConsolidacionService = exports.updateRegistroConsolidacionService = exports.getRegistroConsolidacionByIdService = exports.getAllRegistrosConsolidacionService = exports.createRegistroConsolidacionService = void 0;
const logger_1 = require("../utils/logger");
// src/services/registroConsolidacion.service.ts
const supabaseClient_1 = require("../config/supabaseClient");
const consolidacioncapital_service_1 = require("./consolidacioncapital.service");
const checkConsolidacionExists = async (id) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("ConsolidacionCapital") // Usamos el nombre de la tabla con mayúscula
        .select("IdConsolidacion")
        .eq("IdConsolidacion", id)
        .maybeSingle();
    if (error) {
        throw new Error(`Error de BBDD al verificar Consolidación: ${error.message}`);
    }
    if (!data) {
        throw new Error("Consolidación no encontrada");
    }
};
/**
 * Busca la Consolidación activa cuya FechaInicio y FechaFin cubran la fecha especificada.
 * @param {string} fechaRegistro - La fecha que debe estar dentro del rango de consolidación.
 * @returns {number} El IdConsolidacion activo.
 */
// --- CREAR REGISTRO (MODIFICADO) ---
// Nota: Eliminamos IdConsolidacion de la interfaz de datos si ya no viene del frontend.
// Asumo que el validador Zod y la interfaz se actualizarán para no requerir IdConsolidacion.
const createRegistroConsolidacionService = async (data, idEmpresa) => {
    let idConsolidacionFinal;
    // 1. DETERMINAR EL ID DE CONSOLIDACIÓN A USAR
    if (data.IdConsolidacion) {
        // Opción A: El ID fue proporcionado (usado por el Job/Actualización). CONFIAMOS en el ID.
        idConsolidacionFinal = data.IdConsolidacion;
    }
    else {
        // Opción B: El ID NO fue proporcionado (usado por el controlador/frontend). Debemos buscarlo por fecha.
        // Determinar la fecha de registro (usar la proporcionada o la actual)
        const fechaRegistroParaBusqueda = data.FechaRegistro
            ? new Date(data.FechaRegistro).toISOString()
            : new Date().toISOString();
        // 🚨 Llamar a la función que busca el ID activo por fecha
        idConsolidacionFinal = await (0, consolidacioncapital_service_1.getConsolidacionActivaId)(fechaRegistroParaBusqueda, idEmpresa);
        // Si la búsqueda falla, getConsolidacionActivaId lanzará un error.
    }
    // 2. DETERMINAR LA FECHA DE REGISTRO FINAL (usar la proporcionada o la actual)
    // Ya que la BBDD espera una cadena ISO
    const fechaFinalISO = data.FechaRegistro
        ? new Date(data.FechaRegistro).toISOString()
        : new Date().toISOString();
    // 3. Crear el registro en la consolidación
    const { data: nuevoRegistro, error } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .insert({
        IdConsolidacion: idConsolidacionFinal, // <-- Usamos el ID final determinado
        FechaRegistro: fechaFinalISO, // <-- Usamos la fecha en formato ISO
        TipoRegistro: data.TipoRegistro,
        Estado: data.Estado,
        Descripcion: data.Descripcion,
        Monto: data.Monto,
        IdPago: data.IdPago || null
    })
        .select()
        .single();
    if (error) {
        logger_1.logger.error("Error en createRegistroConsolidacionService:", error.message);
        throw new Error(`Error creando registro: ${error.message}`);
    }
    return nuevoRegistro;
};
exports.createRegistroConsolidacionService = createRegistroConsolidacionService;
// --- OBTENER TODOS ---
const getAllRegistrosConsolidacionService = async (idEmpresa) => {
    // Traducción de findMany con include: Consolidacion
    const { data: lista, error } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            ConsolidacionCapital!inner (*) // Alias para la tabla padre
        `)
        .eq("ConsolidacionCapital.IdEmpresa", idEmpresa);
    if (error) {
        logger_1.logger.error("Error en getAllRegistrosConsolidacionService:", error.message);
        throw new Error(`Error obteniendo registros: ${error.message}`);
    }
    return lista;
};
exports.getAllRegistrosConsolidacionService = getAllRegistrosConsolidacionService;
// --- OBTENER POR ID ---
const getRegistroConsolidacionByIdService = async (id, idEmpresa) => {
    const { data: registro, error } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            ConsolidacionCapital!inner (*)
        `)
        .eq("IdRegistro", id)
        .eq("ConsolidacionCapital.IdEmpresa", idEmpresa)
        .maybeSingle(); // Usamos maybeSingle para manejar el 404
    if (error) {
        throw new Error(`Error de BBDD buscando registro: ${error.message}`);
    }
    if (!registro) {
        throw new Error("Registro no encontrado");
    }
    return registro;
};
exports.getRegistroConsolidacionByIdService = getRegistroConsolidacionByIdService;
// --- ACTUALIZAR ---
const updateRegistroConsolidacionService = async (id, idEmpresa, data) => {
    await (0, exports.getRegistroConsolidacionByIdService)(id, idEmpresa);
    const fechaRegistro = data.FechaRegistro
        ? new Date(data.FechaRegistro).toISOString()
        : new Date().toISOString();
    const { data: actualizado, error } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .update({
        IdConsolidacion: data.IdConsolidacion,
        FechaRegistro: fechaRegistro,
        TipoRegistro: data.TipoRegistro,
        Estado: data.Estado,
        Descripcion: data.Descripcion,
        Monto: data.Monto,
    })
        .eq("IdRegistro", id)
        .select()
        .single();
    if (error) {
        throw new Error(`Error actualizando registro: ${error.message}`);
    }
    if (!actualizado) {
        throw new Error("Registro no encontrado para actualizar");
    }
    return actualizado;
};
exports.updateRegistroConsolidacionService = updateRegistroConsolidacionService;
// --- ELIMINAR ---
const deleteRegistroConsolidacionService = async (id, idEmpresa) => {
    await (0, exports.getRegistroConsolidacionByIdService)(id, idEmpresa);
    const { data, error } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .delete()
        .eq("IdRegistro", id)
        .select()
        .maybeSingle();
    if (error) {
        throw new Error(`Error eliminando registro: ${error.message}`);
    }
    if (!data) {
        throw new Error("Registro no encontrado para eliminar");
    }
    return { message: "Registro de consolidación eliminado" };
};
exports.deleteRegistroConsolidacionService = deleteRegistroConsolidacionService;
