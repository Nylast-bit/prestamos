"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleEstadoPrestatarioService = exports.deletePrestatarioService = exports.updatePrestatarioService = exports.getPrestatarioByIdService = exports.getAllPrestatariosService = exports.createPrestatarioService = void 0;
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
      ),
      Usuario:IdUsuario (
        Estado,
        Rol
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
        const usuario = Array.isArray(prestatario.Usuario) ? prestatario.Usuario[0] : prestatario.Usuario;
        return {
            ...prestatario,
            cantidadActivos: prestamosActivos.length,
            estadoUsuario: usuario?.Estado || 'Sin cuenta',
            rolUsuario: usuario?.Rol || null
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
// --- SOFT DELETE (Desactivar usuario) ---
const deletePrestatarioService = async (id, idEmpresa) => {
    // Buscar el Prestatario y su IdUsuario
    const { data: prestatario } = await supabaseClient_1.supabase
        .from("Prestatario")
        .select("IdUsuario, Email")
        .eq("IdPrestatario", id)
        .eq("IdEmpresa", idEmpresa)
        .maybeSingle();
    if (!prestatario) {
        throw new Error("Prestatario no encontrado.");
    }
    // Desactivar el Usuario vinculado
    if (prestatario.IdUsuario) {
        const { error } = await supabaseClient_1.supabase
            .from("Usuario")
            .update({ Estado: 'Inactivo' })
            .eq("IdUsuario", prestatario.IdUsuario);
        if (error) {
            logger_1.logger.error("Error desactivando usuario:", error.message);
            throw new Error("Error al desactivar el usuario: " + error.message);
        }
    }
    else if (prestatario.Email) {
        // Fallback: buscar por email
        await supabaseClient_1.supabase
            .from("Usuario")
            .update({ Estado: 'Inactivo' })
            .eq("Email", prestatario.Email)
            .eq("IdEmpresa", idEmpresa);
    }
    return { message: "Usuario desactivado exitosamente" };
};
exports.deletePrestatarioService = deletePrestatarioService;
// --- TOGGLE ESTADO ---
const toggleEstadoPrestatarioService = async (id, idEmpresa) => {
    // Buscar el Prestatario y su Usuario vinculado
    const { data: prestatario } = await supabaseClient_1.supabase
        .from("Prestatario")
        .select("IdUsuario, Email")
        .eq("IdPrestatario", id)
        .eq("IdEmpresa", idEmpresa)
        .maybeSingle();
    if (!prestatario) {
        throw new Error("Prestatario no encontrado.");
    }
    let idUsuario = prestatario.IdUsuario;
    if (!idUsuario && prestatario.Email) {
        const { data: usuario } = await supabaseClient_1.supabase
            .from("Usuario")
            .select("IdUsuario, Estado")
            .eq("Email", prestatario.Email)
            .eq("IdEmpresa", idEmpresa)
            .maybeSingle();
        if (usuario)
            idUsuario = usuario.IdUsuario;
    }
    if (!idUsuario) {
        throw new Error("No se encontró un usuario vinculado a este prestamista.");
    }
    // Obtener estado actual
    const { data: usuario } = await supabaseClient_1.supabase
        .from("Usuario")
        .select("Estado")
        .eq("IdUsuario", idUsuario)
        .single();
    if (!usuario)
        throw new Error("Usuario no encontrado.");
    const nuevoEstado = usuario.Estado === 'Activo' ? 'Inactivo' : 'Activo';
    const { error } = await supabaseClient_1.supabase
        .from("Usuario")
        .update({ Estado: nuevoEstado })
        .eq("IdUsuario", idUsuario);
    if (error)
        throw new Error("Error cambiando estado: " + error.message);
    return { message: `Usuario ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`, estado: nuevoEstado };
};
exports.toggleEstadoPrestatarioService = toggleEstadoPrestatarioService;
