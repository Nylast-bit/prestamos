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

    return {
      ...prestatario,
      cantidadActivos: prestamosActivos.length
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

// --- ELIMINAR ---
export const deletePrestatarioService = async (id: number, idEmpresa: number) => {
  const { data: prestatario } = await supabase
    .from("Prestatario")
    .select("Email")
    .eq("IdPrestatario", id)
    .eq("IdEmpresa", idEmpresa)
    .maybeSingle();

  if (prestatario && prestatario.Email) {
    await supabase
      .from("Usuario")
      .delete()
      .eq("Email", prestatario.Email)
      .eq("IdEmpresa", idEmpresa);
  }

  const { error } = await supabase
    .from("Prestatario")
    .delete()
    .eq("IdPrestatario", id)
    .eq("IdEmpresa", idEmpresa);

  if (error) {
    logger.error("Error en deletePrestatarioService:", error.message);
    throw new Error("No se puede eliminar: el prestamista tiene préstamos asociados.");
  }

  return { message: "Prestatario eliminado" };
};