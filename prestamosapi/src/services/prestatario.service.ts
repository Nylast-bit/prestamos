import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";

interface PrestatarioData {
  Nombre?: string;
  Telefono?: string;
  Email?: string;
  Clave?: string;
  IdEmpresa?: number;
  IdUsuario?: number;
}

// --- CREAR ---
export const createPrestatarioService = async (data: PrestatarioData) => {
  const { data: nuevo, error } = await supabase
    .from("Prestatario")
    .insert(data)
    .select()
    .single();

  if (error) {
    logger.error("Error en createPrestatarioService:", error.message);
    throw new Error("Error creando prestatario: " + error.message);
  }
  return nuevo;
};

// --- OBTENER TODOS ---
export const getAllPrestatariosService = async (idEmpresa: number) => {
  const { data, error } = await supabase
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
    logger.error("Error en getAllPrestatariosService:", error.message);
    throw new Error("Error obteniendo prestatarios: " + error.message);
  }

  const listaFormateada = data.map((prestatario: any) => {
    const prestamosActivos = prestatario.Prestamo?.filter((p: any) => p.Estado === 'Activo') || [];
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

// --- OBTENER POR ID (Con conteo de activos) ---
export const getPrestatarioByIdService = async (id: number, idEmpresa: number) => {
  const { data: prestatario, error } = await supabase
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
      logger.error("Error buscando prestatario:", error.message);
      throw new Error("Error buscando prestatario: " + error.message);
    }
  }

  if (!prestatario) {
    throw new Error("Prestatario no encontrado");
  }

  const prestamosActivos = prestatario.Prestamo?.filter((p: any) => p.Estado === 'Activo') || [];

  return {
    ...prestatario,
    cantidadActivos: prestamosActivos.length
  };
};

// --- ACTUALIZAR ---
export const updatePrestatarioService = async (id: number, idEmpresa: number, data: PrestatarioData) => {
  const { data: updated, error } = await supabase
    .from("Prestatario")
    .update(data)
    .eq("IdPrestatario", id)
    .eq("IdEmpresa", idEmpresa)
    .select()
    .single();

  if (error) {
    logger.error("Error en updatePrestatarioService:", error.message);
    throw new Error("Error actualizando prestatario: " + error.message);
  }

  if (!updated) {
    throw new Error("Prestatario no encontrado");
  }

  return updated;
};

// --- SOFT DELETE (Desactivar usuario) ---
export const deletePrestatarioService = async (id: number, idEmpresa: number) => {
  // Buscar el Prestatario y su IdUsuario
  const { data: prestatario } = await supabase
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
    const { error } = await supabase
      .from("Usuario")
      .update({ Estado: 'Inactivo' })
      .eq("IdUsuario", prestatario.IdUsuario);

    if (error) {
      logger.error("Error desactivando usuario:", error.message);
      throw new Error("Error al desactivar el usuario: " + error.message);
    }
  } else if (prestatario.Email) {
    // Fallback: buscar por email
    await supabase
      .from("Usuario")
      .update({ Estado: 'Inactivo' })
      .eq("Email", prestatario.Email)
      .eq("IdEmpresa", idEmpresa);
  }

  return { message: "Usuario desactivado exitosamente" };
};

// --- TOGGLE ESTADO ---
export const toggleEstadoPrestatarioService = async (id: number, idEmpresa: number) => {
  // Buscar el Prestatario y su Usuario vinculado
  const { data: prestatario } = await supabase
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
    const { data: usuario } = await supabase
      .from("Usuario")
      .select("IdUsuario, Estado")
      .eq("Email", prestatario.Email)
      .eq("IdEmpresa", idEmpresa)
      .maybeSingle();
    if (usuario) idUsuario = usuario.IdUsuario;
  }

  if (!idUsuario) {
    throw new Error("No se encontró un usuario vinculado a este prestamista.");
  }

  // Obtener estado actual
  const { data: usuario } = await supabase
    .from("Usuario")
    .select("Estado")
    .eq("IdUsuario", idUsuario)
    .single();

  if (!usuario) throw new Error("Usuario no encontrado.");

  const nuevoEstado = usuario.Estado === 'Activo' ? 'Inactivo' : 'Activo';

  const { error } = await supabase
    .from("Usuario")
    .update({ Estado: nuevoEstado })
    .eq("IdUsuario", idUsuario);

  if (error) throw new Error("Error cambiando estado: " + error.message);

  return { message: `Usuario ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`, estado: nuevoEstado };
};