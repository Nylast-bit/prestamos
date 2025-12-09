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

// --- FUNCIÓN AUXILIAR 1: BUSCAR GASTOS FIJOS ACTIVOS ---
// Busca las plantillas que AÚN no se han pagado en la consolidación actual.
const getActiveFixedExpenses = async (idConsolidacion: number) => {
    
    // Simplificamos el SELECT para que solo use el nombre de la relación (GastoFijoRegistro)
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
        .eq('Activo', true); // Solo gastos activos

    if (error) {
        throw new Error(`Error al buscar plantillas de gastos fijos: ${error.message}`);
    }

    // Filtramos para devolver solo los gastos que NO tienen un registro en esta consolidación.
    const gastosPendientes = (gastos as any[]).filter(gasto => {
        // La consulta de Supabase anida los resultados del join en el array GastoFijoRegistro.
        // Si el array está vacío, significa que el gasto no se ha pagado en el período.
        const registroEnConsolidacion = gasto.GastoFijoRegistro.some(
            (reg: any) => reg.IdConsolidacion === idConsolidacion
        );
        return !registroEnConsolidacion;
    });

    // Usamos 'as any as GastoFijoPlantilla[]' para resolver el error TS2352 de inferencia
    return gastosPendientes as any as GastoFijoPlantilla[];
};

// --- FUNCIÓN PRINCIPAL: PROCESAR Y REGISTRAR EGRESOS ---
/**
 * Procesa todos los gastos fijos pendientes de pago para el período actual.
 * @param {number} idConsolidacion - ID de la consolidación activa (actualmente abierta).
 */
export const processFixedExpenses = async (idConsolidacion: number) => {
    const hoy = new Date();
    const diaActual = hoy.getDate();
    
    // 1. Obtener los gastos que AÚN no se han registrado en esta consolidación
    const gastosPendientes = await getActiveFixedExpenses(idConsolidacion);

    let registrosExitosos = 0;

    for (const gasto of gastosPendientes) {
        
        // 2. Lógica de Validación de Fechas (Regla de Negocio)
        const isDia1 = gasto.Dia1 === diaActual;
        const isDia2 = gasto.Frecuencia === 'quincenal' && gasto.Dia2 === diaActual;
        
        // Lógica de Fin de Mes (Febrero, 30/31):
        const ultimoDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
        const isLastDay = (
            diaActual === ultimoDiaDelMes && 
            (gasto.Dia1 > ultimoDiaDelMes || (gasto.Dia2 && gasto.Dia2 > ultimoDiaDelMes))
        );

        if (isDia1 || isDia2 || isLastDay) {
            
            // 3. ORQUESTACIÓN DE DOBLE REGISTRO (TRANSACCIÓN LÓGICA)
            try {
                // PRIMER REGISTRO: Histórico y de Auditoría (GastoFijoRegistro)
                await gastoFijoRegistroService.createGastoFijoRegistroService({
                    IdGastoFijo: gasto.IdGasto,
                    IdConsolidacion: idConsolidacion,
                    MontoPagado: gasto.Monto,
                });
                
                // SEGUNDO REGISTRO: Contable (RegistroConsolidacion)
                // Se registra como EGRESO.
                await registroConsolidacionService.createRegistroConsolidacionService({
                    IdConsolidacion: idConsolidacion,
                    FechaRegistro: hoy.toISOString(),
                    TipoRegistro: "Egreso", 
                    Estado: "Pagado",
                    Descripcion: `Gasto Fijo: ${gasto.Nombre}`,
                    Monto: gasto.Monto,
                });
                
                registrosExitosos++;

            } catch (error: any) {
                // Registramos el error de una transacción que falló
                console.error(`Error procesando gasto ID ${gasto.IdGasto}: ${error.message}`);
            }
        }
    }

    console.log(`✨ ${registrosExitosos} gastos fijos procesados hoy.`);
    return { success: true, count: registrosExitosos };
};