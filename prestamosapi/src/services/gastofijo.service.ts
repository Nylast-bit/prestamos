// src/services/gastoFijo.service.ts
import { supabase } from "../config/supabaseClient";

// Interfaz para la data (ajustada a los campos que recibe/envía)
interface GastoFijoData {
  Nombre?: string;
  Monto?: number;
  Frecuencia?: string;
  Dia1?: number;
  Dia2?: number | null;
  Activo?: boolean;
}

// --- CREAR ---
export const createGastoFijoService = async (data: GastoFijoData) => {
  const { data: nuevo, error } = await supabase
    .from("GastoFijo")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error en createGastoFijoService:", error.message);
    throw new Error(`Error creando gasto fijo: ${error.message}`);
  }
  return nuevo;
};

// --- OBTENER TODOS ---
export const getAllGastosFijosService = async () => {
  const { data: lista, error } = await supabase
    .from("GastoFijo")
    .select("*");

  if (error) {
    console.error("Error en getAllGastosFijosService:", error.message);
    throw new Error(`Error obteniendo gastos fijos: ${error.message}`);
  }
  return lista;
};

// --- OBTENER POR ID ---
export const getGastoFijoByIdService = async (id: number) => {
  const { data: gasto, error } = await supabase
    .from("GastoFijo")
    .select("*")
    .eq("IdGasto", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Error de BBDD al buscar gasto: ${error.message}`);
  }
  
  if (!gasto) {
    throw new Error("Gasto fijo no encontrado");
  }

  return gasto;
};

// --- ACTUALIZAR ---
export const updateGastoFijoService = async (id: number, data: GastoFijoData) => {
  const { data: actualizado, error } = await supabase
    .from("GastoFijo")
    .update(data)
    .eq("IdGasto", id)
    .select()
    .single();

  if (error) {
    console.error("Error en updateGastoFijoService:", error.message);
    throw new Error(`Error actualizando gasto fijo: ${error.message}`);
  }
  
  if (!actualizado) {
    throw new Error("Gasto fijo no encontrado para actualizar");
  }

  return actualizado;
};

// --- ELIMINAR ---
export const deleteGastoFijoService = async (id: number) => {
  // Nota: Si hay registros en GastoFijoRegistro, la BBDD impedirá esto si no hay CASCADE.
  const { error } = await supabase
    .from("GastoFijo")
    .delete()
    .eq("IdGasto", id);

  if (error) {
    console.error("Error en deleteGastoFijoService:", error.message);
    throw new Error(`Error eliminando gasto fijo: ${error.message}`);
  }
  
  return { message: "Gasto fijo eliminado" };
};