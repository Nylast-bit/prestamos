// src/services/gastoFijoJob.service.ts
import { supabase } from "../config/supabaseClient";
import * as registroConsolidacionService from './registroconsolidacion.service'; 
import * as gastoFijoRegistroService from './gastofijoregistro.service'; // Asegúrate que esta ruta y archivo existan

// --- INTERFACES AUXILIARES ---
interface GastoFijoPlantilla {
    IdGasto: number;
    Nombre: string;
    Monto: number;
    Frecuencia: 'mensual' | 'quincenal';
    Dia1: number;
    Dia2: number | null;
    // La propiedad que devuelve el SELECT de Supabase
    GastoFijoRegistro: { IdConsolidacion: number }[];
}

// src/services/gastoFijoJob.service.ts

// --- FUNCIÓN AUXILIAR: Obtener Fechas de Consolidación ---
const getConsolidacionDates = async (id: number) => {
    const { data, error } = await supabase
        .from("ConsolidacionCapital")
        .select(`FechaInicio, FechaFin`)
        .eq("IdConsolidacion", id)
        .single();
    if (error || !data) {
        throw new Error(`Consolidación ID ${id} no encontrada. Error: ${error?.message}`);
    }
    return { 
        FechaInicio: new Date(data.FechaInicio), 
        FechaFin: new Date(data.FechaFin) 
    };
};

// --- FUNCIÓN AUXILIAR: BUSCAR GASTOS FIJOS ACTIVOS ---
// Busca las plantillas que AÚN no se han pagado en la consolidación actual.
const getActiveFixedExpenses = async (idConsolidacion: number) => {
    
    // 1. SELECT de Gastos Activos y SU ESTADO DE PAGO en la Consolidación (ID 7, por ejemplo)
    const { data: gastos, error } = await supabase
        .from("GastoFijo")
        .select(`
            IdGasto,
            Nombre,
            Monto,
            Frecuencia,
            Dia1,
            Dia2,
            GastoFijoRegistro (
                IdConsolidacion 
            )
        `)
        .eq('Activo', true); 

    if (error) {
        throw new Error(`Error al buscar plantillas de gastos fijos: ${error.message}`);
    }
    
    // 2. FILTRO CLAVE: Devolvemos solo los gastos que NO tengan un GastoFijoRegistro para el IdConsolidacion actual.
    const gastosPendientes = (gastos as any[]).filter(gasto => {
        
        // Verificamos si existe CUALQUIER registro de pago para este gasto dentro de la lista de registros devuelta.
        const registroEnConsolidacion = gasto.GastoFijoRegistro.some(
            (reg: any) => reg.IdConsolidacion === idConsolidacion
        );
        
        // Si no hay registro en esta consolidación, está pendiente.
        return !registroEnConsolidacion;
    });

    console.log(`DEBUG: ${gastosPendientes.length} gastos fijos pendientes de registro.`);

    return gastosPendientes as any; // Dejamos 'as any' para evitar el error de tipado.
};

/// --- FUNCIÓN PRINCIPAL: PROCESAR Y REGISTRAR EGRESOS POR PERÍODO ---
/**
 * Procesa todos los gastos fijos que DEBEN caer dentro del rango de fechas de la consolidación.
 * Los registra como Egreso y Estado 'Pendiente'.
 * @param {number} idConsolidacion - ID de la consolidación actualmente creada.
 */
export const processFixedExpenses = async (idConsolidacion: number) => {
    
    // 1. Obtener el rango de fechas de la Consolidación (y convertirlos a objetos Date)
    const { FechaInicio, FechaFin } = await getConsolidacionDates(idConsolidacion);
    const inicioMes = FechaInicio.getMonth();
    const inicioYear = FechaInicio.getFullYear();
    
    // 2. Obtener los gastos pendientes (que aún no se han registrado en esta consolidación)
    const gastosPendientes = await getActiveFixedExpenses(idConsolidacion);

    let registrosExitosos = 0;
    
    for (const gasto of gastosPendientes) {
        
        let shouldRegister = false;
        
        // --- 3.1. Verificar Dia1 ---
        // Generamos la fecha de pago basada en el mes/año de inicio de la consolidación y el Dia1 del gasto
        let fechaPago1 = new Date(inicioYear, inicioMes, gasto.Dia1);

        // Si la fecha calculada es anterior al inicio de la consolidación, asumimos que el pago corresponde
        // al mes siguiente o que debe ser considerado si el rango es corto.
        // La mejor práctica para períodos que atraviesan fin de mes es siempre buscar el primer día de pago válido.
        
        // Ajuste: si la fecha de pago cae ANTES del inicio de la consolidación, la movemos al siguiente mes
        // O si el día calculado no existe (ej. 31 de abril), Date() lo desborda al mes siguiente.
        if (fechaPago1.getTime() < FechaInicio.getTime()) {
            fechaPago1 = new Date(inicioYear, inicioMes + 1, gasto.Dia1);
        }

        // 4. Verificación Clave: ¿La fecha de pago cae DENTRO del PERÍODO de Consolidación?
        // Usamos getTime() para comparar los timestamps.
        if (fechaPago1.getTime() >= FechaInicio.getTime() && fechaPago1.getTime() <= FechaFin.getTime()) {
            shouldRegister = true;
        }

        // --- 3.2. Verificar Dia2 (Quincenal) ---
        if (gasto.Frecuencia === 'quincenal' && gasto.Dia2) {
            let fechaPago2 = new Date(inicioYear, inicioMes, gasto.Dia2);
            
            if (fechaPago2.getTime() < FechaInicio.getTime()) {
                fechaPago2 = new Date(inicioYear, inicioMes + 1, gasto.Dia2);
            }

            if (fechaPago2.getTime() >= FechaInicio.getTime() && fechaPago2.getTime() <= FechaFin.getTime()) {
                shouldRegister = true;
            }
        }
        
        // --- ORQUESTACIÓN DE REGISTRO ---
        if (shouldRegister) {
            
            const fechaRegistro = new Date().toISOString(); // Usar la fecha actual del servidor para el registro
            
            try {
                // 1. Registro Histórico y de Auditoría (GastoFijoRegistro)
                await gastoFijoRegistroService.createGastoFijoRegistroService({
                    IdGastoFijo: gasto.IdGasto,
                    IdConsolidacion: idConsolidacion,
                    MontoPagado: gasto.Monto,
                });
                
                // 2. Registro Contable (RegistroConsolidacion)
                await registroConsolidacionService.createRegistroConsolidacionService({
                    IdConsolidacion: idConsolidacion,
                    FechaRegistro: fechaRegistro, 
                    TipoRegistro: "Egreso", 
                    Estado: "Pendiente", // <-- REGISTRO COMO PENDIENTE
                    Descripcion: `Gasto Fijo: ${gasto.Nombre}`,
                    Monto: gasto.Monto,
                });
                
                registrosExitosos++;

            } catch (error: any) {
                console.error(`Error procesando gasto ID ${gasto.IdGasto}: ${error.message}`);
            }
        }
    }

    console.log(`✨ ${registrosExitosos} gastos fijos programados para el período.`);
    return { success: true, count: registrosExitosos };
};