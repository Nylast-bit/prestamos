import { logger } from '../utils/logger';
// src/services/prestatario.service.ts
import { supabase } from "../config/supabaseClient";

// Definición de tipos simplificados para inputs
interface PrestatarioData {
  Nombre?: string;
  Telefono?: string;
  Email?: string;
  Clave?: string;
  IdEmpresa?: number;
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
  // 1. Hacemos el select incluyendo la relación Prestamo
  const { data, error } = await supabase
    .from("Prestatario")
    .select(`
      *,
      Prestamo (
        Estado
      )
    `)
    .eq('IdEmpresa', idEmpresa)
    .order('IdPrestatario', { ascending: true }); // Ordenar para que la tabla no brinque

  if (error) {
    logger.error("Error en getAllPrestatariosService:", error.message);
    throw new Error("Error obteniendo prestatarios: " + error.message);
  }

  // 2. Transformamos la data para agregar el campo "cantidadActivos"
  // Supabase nos devuelve: { Nombre: "Juan", Prestamo: [{Estado: "Activo"}, {Estado: "Pagado"}] }
  // Nosotros queremos: { Nombre: "Juan", cantidadActivos: 1 }

  const listaFormateada = data.map((prestatario: any) => {
    // Filtramos solo los que están "Activo" (o el estado que uses)
    const prestamosActivos = prestatario.Prestamo?.filter((p: any) => p.Estado === 'Activo') || [];

    return {
      ...prestatario,
      cantidadActivos: prestamosActivos.length, // Aquí está el número mágico
      // Opcional: Si no quieres ensuciar el objeto con el array de préstamos, puedes borrarlo:
      // Prestamo: undefined 
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

  // Hacemos el mismo cálculo para el detalle individual
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

  // Si no se encontró el prestatario para actualizar
  if (!updated) {
    throw new Error("Prestatario no encontrado");
  }

  return updated;
};

// --- ELIMINAR ---
export const deletePrestatarioService = async (id: number, idEmpresa: number) => {
  // 1. Obtener el prestatario para saber su Email (y poder borrar el Usuario)
  const { data: prestatario } = await supabase
    .from("Prestatario")
    .select("Email")
    .eq("IdPrestatario", id)
    .eq("IdEmpresa", idEmpresa)
    .maybeSingle();

  if (prestatario && prestatario.Email) {
    // Intentar borrar el usuario de la tabla Usuario de forma paralela o previa
    await supabase
      .from("Usuario")
      .delete()
      .eq("Email", prestatario.Email)
      .eq("IdEmpresa", idEmpresa);
  }

  // 2. Borrar prestatario
  // IMPORTANTE: Esto requiere que la FK en la DB tenga ON DELETE CASCADE para borrar préstamos asociados.
  const { error } = await supabase
    .from("Prestatario")
    .delete()
    .eq("IdPrestatario", id)
    .eq("IdEmpresa", idEmpresa);

  if (error) {
    logger.error("Error en deletePrestatarioService:", error.message);
    throw new Error("No se puede eliminar: el prestamista tiene préstamos asociados. Ejecuta el script de SQL proporcionado para permitir eliminar con cascada.");
  }

  return { message: "Prestatario eliminado" };
};