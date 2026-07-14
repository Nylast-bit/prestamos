"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGastoFijoRegistroService = void 0;
const logger_1 = require("../utils/logger");
// src/services/gastoFijoRegistro.service.ts
const supabaseClient_1 = require("../config/supabaseClient");
/**
 * Registra la ejecución de un pago de Gasto Fijo en la tabla de auditoría.
 * (Esta es la primera parte del registro contable, la segunda es en RegistroConsolidacion)
 * * @param {GastoFijoRegistroInput} data - Datos de la ejecución del gasto.
 * @returns El objeto de registro creado.
 */
const createGastoFijoRegistroService = async (data, idEmpresa) => {
    const { data: nuevoRegistro, error } = await supabaseClient_1.supabase
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
        logger_1.logger.error("Error en createGastoFijoRegistroService:", error.message);
        throw new Error(`Error registrando gasto fijo: ${error.message}`);
    }
    logger_1.logger.info(`✅ Registro de Gasto Fijo ID ${data.IdGastoFijo} completado.`);
    return nuevoRegistro;
};
exports.createGastoFijoRegistroService = createGastoFijoRegistroService;
