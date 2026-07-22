"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistroConsolidacionService = exports.updateRegistroConsolidacionService = exports.getRegistroConsolidacionByIdService = exports.getAllRegistrosConsolidacionService = exports.createRegistroConsolidacionService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const consolidacioncapital_service_1 = require("./consolidacioncapital.service");
// --- CREAR REGISTRO ---
const createRegistroConsolidacionService = async (data, idEmpresa) => {
    let idConsolidacionFinal;
    if (data.IdConsolidacion) {
        idConsolidacionFinal = data.IdConsolidacion;
    }
    else {
        const fechaRegistroParaBusqueda = data.FechaRegistro
            ? new Date(data.FechaRegistro).toISOString()
            : new Date().toISOString();
        idConsolidacionFinal = await (0, consolidacioncapital_service_1.getConsolidacionActivaId)(fechaRegistroParaBusqueda, idEmpresa);
    }
    const fechaFinalISO = data.FechaRegistro
        ? new Date(data.FechaRegistro).toISOString()
        : new Date().toISOString();
    const { data: nuevoRegistro, error } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .insert({
        IdConsolidacion: idConsolidacionFinal,
        FechaRegistro: fechaFinalISO,
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
// --- OBTENER TODOS (Con filtro opcional por idConsolidacion) ---
const getAllRegistrosConsolidacionService = async (idEmpresa, idConsolidacion) => {
    let query = supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            ConsolidacionCapital!inner (*)
        `)
        .eq("ConsolidacionCapital.IdEmpresa", idEmpresa)
        .order("IdRegistro", { ascending: false });
    if (idConsolidacion) {
        query = query.eq("IdConsolidacion", idConsolidacion);
    }
    const { data: lista, error } = await query;
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
        .maybeSingle();
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
