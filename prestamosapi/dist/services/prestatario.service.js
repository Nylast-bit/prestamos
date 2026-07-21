"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePrestatarioService = exports.updatePrestatarioService = exports.getPrestatarioByIdService = exports.getAllPrestatariosService = exports.createPrestatarioService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
// --- CREAR ---
const createPrestatarioService = async (data) => {
    const { data: nuevo, error } = await supabaseClient_1.supabase
        .from("Prestatario")
        .insert(data)
        .select()
        .single();
    if (error) {
        logger_1.logger.error("Error en createPrestatarioService:", error.message);
        throw new Error("Error creando prestatario: " + error.message);
    }
    return nuevo;
};
exports.createPrestatarioService = createPrestatarioService;
// --- OBTENER TODOS ---
const getAllPrestatariosService = async (idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Prestatario")
        .select(`
      *,
      Prestamo (
        Estado
      )
    `)
        .eq('IdEmpresa', idEmpresa)
        .order('IdPrestatario', { ascending: true });
    if (error) {
        logger_1.logger.error("Error en getAllPrestatariosService:", error.message);
        throw new Error("Error obteniendo prestatarios: " + error.message);
    }
    const listaFormateada = data.map((prestatario) => {
        const prestamosActivos = prestatario.Prestamo?.filter((p) => p.Estado === 'Activo') || [];
        return {
            ...prestatario,
            cantidadActivos: prestamosActivos.length
        };
    });
    return listaFormateada;
};
exports.getAllPrestatariosService = getAllPrestatariosService;
// --- OBTENER POR ID (Con conteo de activos) ---
const getPrestatarioByIdService = async (id, idEmpresa) => {
    const { data: prestatario, error } = await supabaseClient_1.supabase
        .from("Prestatario")
        .select(`
      *,
      Prestamo (
        Estado
      )
    `)
        .eq("IdPrestatario", id)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (error) {
        if (error.code !== 'PGRST116') {
            logger_1.logger.error("Error buscando prestatario:", error.message);
            throw new Error("Error buscando prestatario: " + error.message);
        }
    }
    if (!prestatario) {
        throw new Error("Prestatario no encontrado");
    }
    const prestamosActivos = prestatario.Prestamo?.filter((p) => p.Estado === 'Activo') || [];
    return {
        ...prestatario,
        cantidadActivos: prestamosActivos.length
    };
};
exports.getPrestatarioByIdService = getPrestatarioByIdService;
// --- ACTUALIZAR ---
const updatePrestatarioService = async (id, idEmpresa, data) => {
    const { data: updated, error } = await supabaseClient_1.supabase
        .from("Prestatario")
        .update(data)
        .eq("IdPrestatario", id)
        .eq("IdEmpresa", idEmpresa)
        .select()
        .single();
    if (error) {
        logger_1.logger.error("Error en updatePrestatarioService:", error.message);
        throw new Error("Error actualizando prestatario: " + error.message);
    }
    if (!updated) {
        throw new Error("Prestatario no encontrado");
    }
    return updated;
};
exports.updatePrestatarioService = updatePrestatarioService;
// --- ELIMINAR ---
const deletePrestatarioService = async (id, idEmpresa) => {
    const { data: prestatario } = await supabaseClient_1.supabase
        .from("Prestatario")
        .select("Email")
        .eq("IdPrestatario", id)
        .eq("IdEmpresa", idEmpresa)
        .maybeSingle();
    if (prestatario && prestatario.Email) {
        await supabaseClient_1.supabase
            .from("Usuario")
            .delete()
            .eq("Email", prestatario.Email)
            .eq("IdEmpresa", idEmpresa);
    }
    const { error } = await supabaseClient_1.supabase
        .from("Prestatario")
        .delete()
        .eq("IdPrestatario", id)
        .eq("IdEmpresa", idEmpresa);
    if (error) {
        logger_1.logger.error("Error en deletePrestatarioService:", error.message);
        throw new Error("No se puede eliminar: el prestamista tiene préstamos asociados.");
    }
    return { message: "Prestatario eliminado" };
};
exports.deletePrestatarioService = deletePrestatarioService;
