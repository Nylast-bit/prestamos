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

// --- ELIMINAR CON DEPENDENCIA ---
export const deleteConsolidacionCapitalService = async (id: number) => {
    
    // 1. Eliminar los registros hijos de RegistroConsolidacion
    const { error: errorRegistro } = await supabase
        .from("RegistroConsolidacion")
        .delete()
        .eq("IdConsolidacion", id);

    if (errorRegistro) {
        console.error(`Error eliminando registros de consolidación para ${id}:`, errorRegistro.message);
        throw new Error(`Error eliminando registros dependientes: ${errorRegistro.message}`);
    }

    // 🚨 2. ELIMINAR LOS REGISTROS HIJOS DE GastoFijoRegistro (La nueva dependencia)
    const { error: errorGastoFijo } = await supabase
        .from("GastoFijoRegistro")
        .delete()
        .eq("IdConsolidacion", id);

    if (errorGastoFijo) {
        console.error(`Error eliminando GastoFijoRegistro para ${id}:`, errorGastoFijo.message);
        throw new Error(`Error eliminando registros de gastos fijos dependientes: ${errorGastoFijo.message}`);
    }


    // 3. Eliminar la ConsolidacionCapital padre
    const { data: deleted, error: errorConsolidacion } = await supabase
        .from("ConsolidacionCapital")
        .delete()
        .eq("IdConsolidacion", id)
        .select()
        .maybeSingle();

    if (errorConsolidacion) {
        console.error("Error en deleteConsolidacionCapitalService:", errorConsolidacion.message);
        throw new Error(`Error eliminando consolidación: ${errorConsolidacion.message}`);
    }
    
    if (!deleted) {
        throw new Error("Consolidación no encontrada para eliminar");
    }

    return { message: "Consolidación de capital y todos sus registros dependientes eliminados" };
};