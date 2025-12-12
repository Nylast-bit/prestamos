// src/services/registroConsolidacion.service.ts
import { supabase } from "../config/supabaseClient";
import { z } from "zod"; // Se usa para inferir tipos si es necesario
// Asumo que el schema se importa desde el validador, aunque no lo necesitemos aquí
// import { registroConsolidacionSchema } from "../validators/registroconsolidacion.validator"; 

// Nota: Esta interfaz se infiere del cuerpo de datos de tu controlador
interface RegistroConsolidacionData {
  IdConsolidacion?: number;
  FechaRegistro?: string | Date;
  TipoRegistro: string;
  Estado: string;
  Descripcion: string;
  Monto: number;
}


const checkConsolidacionExists = async (id: number) => {

    const { data, error } = await supabase

        .from("ConsolidacionCapital") // Usamos el nombre de la tabla con mayúscula

        .select("IdConsolidacion")

        .eq("IdConsolidacion", id)

        .maybeSingle();



    if (error) {

        throw new Error(`Error de BBDD al verificar Consolidación: ${error.message}`);

    }

    if (!data) {

        throw new Error("Consolidación no encontrada");

    }

};

/**
 * Busca la Consolidación activa cuya FechaInicio y FechaFin cubran la fecha especificada.
 * @param {string} fechaRegistro - La fecha que debe estar dentro del rango de consolidación.
 * @returns {number} El IdConsolidacion activo.
 */
const getConsolidacionActivaId = async (fechaRegistro: string): Promise<number> => {
    
    // 1. Buscamos la Consolidación donde FechaRegistro >= FechaInicio AND FechaRegistro <= FechaFin
    const { data: consolidacion, error } = await supabase
        .from("ConsolidacionCapital")
        .select("IdConsolidacion") 
        .lte("FechaInicio", fechaRegistro)   
        .gte("FechaFin", fechaRegistro)      
        .order('FechaGeneracion', { ascending: false }) // 🚨 AÑADIMOS ORDEN 🚨
        .limit(1)                                     // 🚨 AÑADIMOS LÍMITE 🚨
        .maybeSingle(); // Ahora esto es seguro

    if (error) {
        throw new Error(`Error de BBDD al buscar consolidación activa: ${error.message}`);
    }

    if (!consolidacion) {
        throw new Error("No existe una consolidación activa que cubra la fecha de hoy.");
    }

    return consolidacion.IdConsolidacion;
};


// --- CREAR REGISTRO (MODIFICADO) ---
// Nota: Eliminamos IdConsolidacion de la interfaz de datos si ya no viene del frontend.
// Asumo que el validador Zod y la interfaz se actualizarán para no requerir IdConsolidacion.
export const createRegistroConsolidacionService = async (data: RegistroConsolidacionData) => {
    
    let idConsolidacionFinal: number;

    // 1. DETERMINAR EL ID DE CONSOLIDACIÓN A USAR
    if (data.IdConsolidacion) {
        // Opción A: El ID fue proporcionado (usado por el Job/Actualización). CONFIAMOS en el ID.
        idConsolidacionFinal = data.IdConsolidacion;
    } else {
        // Opción B: El ID NO fue proporcionado (usado por el controlador/frontend). Debemos buscarlo por fecha.
        
        // Determinar la fecha de registro (usar la proporcionada o la actual)
        const fechaRegistroParaBusqueda = data.FechaRegistro 
            ? new Date(data.FechaRegistro).toISOString() 
            : new Date().toISOString();
        
        // 🚨 Llamar a la función que busca el ID activo por fecha
        idConsolidacionFinal = await getConsolidacionActivaId(fechaRegistroParaBusqueda); 

        // Si la búsqueda falla, getConsolidacionActivaId lanzará un error.
    }

    // 2. DETERMINAR LA FECHA DE REGISTRO FINAL (usar la proporcionada o la actual)
    // Ya que la BBDD espera una cadena ISO
    const fechaFinalISO = data.FechaRegistro 
        ? new Date(data.FechaRegistro).toISOString() 
        : new Date().toISOString();
    
    // 3. Crear el registro en la consolidación
    const { data: nuevoRegistro, error } = await supabase
        .from("RegistroConsolidacion") 
        .insert({
            IdConsolidacion: idConsolidacionFinal, // <-- Usamos el ID final determinado
            FechaRegistro: fechaFinalISO, // <-- Usamos la fecha en formato ISO
            TipoRegistro: data.TipoRegistro,
            Estado: data.Estado,
            Descripcion: data.Descripcion,
            Monto: data.Monto,
        })
        .select()
        .single();

    if (error) {
        console.error("Error en createRegistroConsolidacionService:", error.message);
        throw new Error(`Error creando registro: ${error.message}`);
    }
    return nuevoRegistro;
};

// --- OBTENER TODOS ---
export const getAllRegistrosConsolidacionService = async () => {
    // Traducción de findMany con include: Consolidacion
    const { data: lista, error } = await supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            Consolidacion:ConsolidacionCapital (*) // Alias para la tabla padre
        `);

    if (error) {
        console.error("Error en getAllRegistrosConsolidacionService:", error.message);
        throw new Error(`Error obteniendo registros: ${error.message}`);
    }
    return lista;
};

// --- OBTENER POR ID ---
export const getRegistroConsolidacionByIdService = async (id: number) => {
    const { data: registro, error } = await supabase
        .from("RegistroConsolidacion")
        .select(`
            *,
            Consolidacion:ConsolidacionCapital (*)
        `)
        .eq("IdRegistro", id)
        .maybeSingle(); // Usamos maybeSingle para manejar el 404

    if (error) {
        throw new Error(`Error de BBDD buscando registro: ${error.message}`);
    }
    if (!registro) {
        throw new Error("Registro no encontrado");
    }
    return registro;
};

// --- ACTUALIZAR ---
export const updateRegistroConsolidacionService = async (id: number, data: RegistroConsolidacionData) => {
    // Lógica de negocio: Validar que la Consolidación exista
    await (data.IdConsolidacion); 

    const fechaRegistro = data.FechaRegistro 
                       ? new Date(data.FechaRegistro).toISOString() 
                       : new Date().toISOString();

    const { data: actualizado, error } = await supabase
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

// --- ELIMINAR ---
export const deleteRegistroConsolidacionService = async (id: number) => {
    const { data, error } = await supabase
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