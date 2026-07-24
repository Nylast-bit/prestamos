"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistroConsolidacionService = exports.updateRegistroConsolidacionService = exports.getRegistroConsolidacionByIdService = exports.getAllRegistrosConsolidacionService = exports.createRegistroConsolidacionService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const consolidacioncapital_service_1 = require("./consolidacioncapital.service");
// --- CREAR REGISTRO ---
const createRegistroConsolidacionService = async (data, idEmpresa) => {
    const fechaFinalISO = data.FechaRegistro
        ? new Date(data.FechaRegistro).toISOString()
        : new Date().toISOString();
    const idConsolidacionFinal = data.IdConsolidacion
        ? data.IdConsolidacion
        : await (0, consolidacioncapital_service_1.getConsolidacionActivaId)(fechaFinalISO, idEmpresa);
    const tipoNorm = (data.TipoRegistro || '').toLowerCase().trim();
    const estadoNorm = (data.Estado || '').toLowerCase().trim();
    if (tipoNorm === 'egreso' && estadoNorm !== 'pendiente') {
        const infoBalance = await (0, consolidacioncapital_service_1.getBalanceDisponibleActivoService)(idEmpresa, fechaFinalISO);
        const balanceDisponible = infoBalance.balanceDisponible;
        const montoEgreso = Number(data.Monto || 0);
        if (montoEgreso > balanceDisponible) {
            const formattedBalance = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(balanceDisponible);
            const formattedMonto = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(montoEgreso);
            throw new Error(`Saldo insuficiente en caja. El balance disponible es ${formattedBalance} y se intentó retirar/desembolsar ${formattedMonto}.`);
        }
    }
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
// --- OBTENER REGISTROS DE UNA CONSOLIDACIÓN ESPECÍFICA ---
const getAllRegistrosConsolidacionService = async (idEmpresa, idConsolidacion) => {
    let targetId = idConsolidacion;
    if (!targetId) {
        targetId = await (0, consolidacioncapital_service_1.getConsolidacionActivaId)(new Date().toISOString(), idEmpresa);
    }
    const { data: lista, error } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            ConsolidacionCapital!inner (IdEmpresa)
        `)
        .eq("ConsolidacionCapital.IdEmpresa", idEmpresa)
        .eq("IdConsolidacion", targetId)
        .order("IdRegistro", { ascending: false });
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
