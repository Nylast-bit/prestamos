// src/services/gastoFijoRegistro.service.ts
import { supabase } from "../config/supabaseClient";

// --- INTERFAZ DE ENTRADA ---
// El job nos proporcionará esta información
export interface GastoFijoRegistroInput {
  IdGastoFijo: number;
  IdConsolidacion: number;
  MontoPagado: number;
  // FechaEjecucion se inicializará con el default de la BBDD (NOW())
}

/**
 * Registra la ejecución de un pago de Gasto Fijo en la tabla de auditoría.
 * (Esta es la primera parte del registro contable, la segunda es en RegistroConsolidacion)
 * * @param {GastoFijoRegistroInput} data - Datos de la ejecución del gasto.
 * @returns El objeto de registro creado.
 */
export const createGastoFijoRegistroService = async (data: GastoFijoRegistroInput) => {
  const { data: nuevoRegistro, error } = await supabase
    .from("GastoFijoRegistro") // Nombre de la nueva tabla
    .insert({
        "IdGastoFijo": data.IdGastoFijo,
        "IdConsolidacion": data.IdConsolidacion,
        "MontoPagado": data.MontoPagado,
        // FechaEjecucion usa el valor por defecto de la base de datos (NOW())
    })
    .select()
    .single();

  if (error) {
    console.error("Error en createGastoFijoRegistroService:", error.message);
    throw new Error(`Error registrando gasto fijo: ${error.message}`);
  }
  
  console.log(`✅ Registro de Gasto Fijo ID ${data.IdGastoFijo} completado.`);
  return nuevoRegistro;
};