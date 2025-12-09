// src/services/consolidacionCapital.service.ts
import { supabase } from "../config/supabaseClient";

// Define un tipo para los datos de entrada
interface ConsolidacionCapitalData {
  FechaInicio?: string | Date | null;
  FechaFin?: string | Date | null;
  CapitalEntrante?: number;
  CapitalSaliente?: number;
  Observaciones?: string | null;
  FechaGeneracion?: string | Date;
}

// --- CREAR ---
export const createConsolidacionCapitalService = async (data: ConsolidacionCapitalData) => {
  // Nota: Transformamos las fechas antes de enviar a Supabase.
  const { data: nuevo, error } = await supabase
    .from("VistaConsolidacionCapital")
    .insert({
      FechaInicio: data.FechaInicio ? new Date(data.FechaInicio).toISOString() : null,
      FechaFin: data.FechaFin ? new Date(data.FechaFin).toISOString() : null,
      CapitalEntrante: data.CapitalEntrante,
      CapitalSaliente: data.CapitalSaliente,
      Observaciones: data.Observaciones || null,
      FechaGeneracion: data.FechaGeneracion
            ? new Date(data.FechaGeneracion).toISOString()
            : new Date(data.FechaGeneracion!).toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Error en createConsolidacionCapitalService:", error.message);
    throw new Error(`Error creando consolidación: ${error.message}`);
  }
  return nuevo;
};

// --- OBTENER TODAS ---
export const getAllConsolidacionesCapitalService = async () => {
  // Traducción de findMany con include: Registros (Relación uno-a-muchos)
  const { data: lista, error } = await supabase
    .from("VistaConsolidacionCapital")
    .select(`
      *,
      Registros:RegistroConsolidacion (*)
    `);

  if (error) {
    console.error("Error en getAllConsolidacionesCapitalService:", error.message);
    throw new Error(`Error obteniendo consolidaciones: ${error.message}`);
  }
  return lista;
};

// --- OBTENER POR ID ---
export const getConsolidacionCapitalByIdService = async (id: number) => {
  // Traducción de findUnique con include: Registros
  const { data: consolidacion, error } = await supabase
    .from("VistaConsolidacionCapital")
    .select(`
        *,
        Registros:RegistroConsolidacion (*)
    `)
    .eq("IdConsolidacion", id)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
        console.error("Error buscando consolidación:", error.message);
        throw new Error(`Error buscando consolidación: ${error.message}`);
    }
  }

  if (!consolidacion) {
    throw new Error("Consolidación no encontrada");
  }

  return consolidacion;
};

// --- ACTUALIZAR ---
export const updateConsolidacionCapitalService = async (id: number, data: ConsolidacionCapitalData) => {
  // Transformación de fechas para el update
  const { data: actualizado, error } = await supabase
    .from("VistaConsolidacionCapital")
    .update({
        FechaInicio: data.FechaInicio ? new Date(data.FechaInicio).toISOString() : null,
        FechaFin: data.FechaFin ? new Date(data.FechaFin).toISOString() : null,
        CapitalEntrante: data.CapitalEntrante,
        CapitalSaliente: data.CapitalSaliente,
        Observaciones: data.Observaciones || null,
        FechaGeneracion: data.FechaGeneracion
            ? new Date(data.FechaGeneracion).toISOString()
            : new Date(data.FechaGeneracion!).toISOString()
    })
    .eq("IdConsolidacion", id)
    .select()
    .single();

  if (error) {
    console.error("Error en updateConsolidacionCapitalService:", error.message);
    throw new Error(`Error actualizando consolidación: ${error.message}`);
  }
  
  if (!actualizado) {
    throw new Error("Consolidación no encontrada para actualizar");
  }

  return actualizado;
};

// --- ELIMINAR ---
export const deleteConsolidacionCapitalService = async (id: number) => {
  // Eliminación simple (asumiendo que las tablas dependientes tienen ON DELETE CASCADE)
  const { data: deleted, error } = await supabase
    .from("VistaConsolidacionCapital")
    .delete()
    .eq("IdConsolidacion", id)
    .select()
    .maybeSingle(); // Usamos maybeSingle para verificar si existía

  if (error) {
    console.error("Error en deleteConsolidacionCapitalService:", error.message);
    throw new Error(`Error eliminando consolidación: ${error.message}`);
  }
  
  if (!deleted) {
    throw new Error("Consolidación no encontrada para eliminar");
  }

  return { message: "Consolidación de capital eliminada" };
};