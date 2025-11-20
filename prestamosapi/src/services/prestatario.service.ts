// src/services/prestatario.service.ts
import { supabase } from "../config/supabaseClient";

// Definición de tipos simplificados para inputs
interface PrestatarioData {
  Nombre?: string;
  Telefono?: string;
  Email?: string;
  Clave?: string;
}

// --- CREAR ---
export const createPrestatarioService = async (data: PrestatarioData) => {
  const { data: nuevo, error } = await supabase
    .from("Prestatario")
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("Error en createPrestatarioService:", error.message);
    throw new Error("Error creando prestatario: " + error.message);
  }
  return nuevo;
};

// --- OBTENER TODOS ---
export const getAllPrestatariosService = async () => {
  const { data: lista, error } = await supabase
    .from("Prestatario")
    .select("*");

  if (error) {
    console.error("Error en getAllPrestatariosService:", error.message);
    throw new Error("Error obteniendo prestatarios: " + error.message);
  }
  return lista;
};

// --- OBTENER POR ID ---
export const getPrestatarioByIdService = async (id: number) => {
  const { data: prestatario, error } = await supabase
    .from("Prestatario")
    .select("*")
    .eq("IdPrestatario", id)
    .single();

  if (error) {
    // Si es un error de PostgREST, lo lanzamos.
    if (error.code !== 'PGRST116') { 
        console.error("Error buscando prestatario:", error.message);
        throw new Error("Error buscando prestatario: " + error.message);
    }
  }
  
  // Si no se encontró el registro (el resultado de .single() es null sin error PGRST116)
  if (!prestatario) {
    throw new Error("Prestatario no encontrado");
  }

  return prestatario;
};

// --- ACTUALIZAR ---
export const updatePrestatarioService = async (id: number, data: PrestatarioData) => {
  const { data: updated, error } = await supabase
    .from("Prestatario")
    .update(data)
    .eq("IdPrestatario", id)
    .select()
    .single();

  if (error) {
    console.error("Error en updatePrestatarioService:", error.message);
    throw new Error("Error actualizando prestatario: " + error.message);
  }

  // Si no se encontró el prestatario para actualizar
  if (!updated) {
    throw new Error("Prestatario no encontrado");
  }
  
  return updated;
};

// --- ELIMINAR ---
export const deletePrestatarioService = async (id: number) => {
  const { error } = await supabase
    .from("Prestatario")
    .delete()
    .eq("IdPrestatario", id)
    .single(); // Usamos .single() para verificar que se eliminó uno

  if (error) {
    console.error("Error en deletePrestatarioService:", error.message);
    throw new Error("Error eliminando prestatario: " + error.message);
  }
  
  // Nota: Si usaste CASCADE en tu base de datos, las tablas relacionadas
  // se eliminarán automáticamente. La lógica es simple aquí.

  return { message: "Prestatario eliminado" };
};