// src/services/capitalJob.service.ts
import { supabase } from "../config/supabaseClient";
import * as registroConsolidacionService from './registroconsolidacion.service'; // Para registrar el Capital Cierre
import * as gastoFijoJobService from './gastofijojob.service';

// --- FUNCIÓN AUXILIAR: BUSCAR LA ÚLTIMA CONSOLIDACIÓN CERRADA ---
const getUltimaConsolidacionCerrada = async () => {
    const { data, error } = await supabase
        .from("ConsolidacionCapital") // O 'VistaConsolidacion' si la creaste
        .select(`
            IdConsolidacion, 
            FechaFin, 
            CapitalEntrante, 
            CapitalSaliente
        `)
        // Buscamos la que tenga la FechaFin más reciente (Orden descendente)
        .order('FechaFin', { ascending: false }) 
        .limit(1)
        .maybeSingle(); 

    if (error) {
        throw new Error(`Error de BBDD al buscar la última consolidación: ${error.message}`);
    }
    return data;
};

// --- FUNCIÓN PRINCIPAL: VERIFICAR Y CREAR CONSOLIDACIÓN ---
export const checkAndCreateConsolidation = async () => {
    
    // 1. Definir la fecha de hoy
    const hoy = new Date();
    // Obtener solo el número del día (1 al 31)
    const diaActual = hoy.getDate(); 

    // 2. LÓGICA DE CIERRE: Solo si es día 8 o día 23
    if (diaActual === 8 || diaActual === 23) {
    //if (true) {
        
        const ultimaConsolidacion = await getUltimaConsolidacionCerrada();
        
        // Si no hay consolidación anterior, simplemente iniciamos con 0
        const capitalCierre = ultimaConsolidacion 
            ? (ultimaConsolidacion.CapitalEntrante - ultimaConsolidacion.CapitalSaliente)
            : 0; 
            
        // DETERMINAR TIPO Y MONTO ABSOLUTO
        
        // 3. Crear el período de la nueva Consolidación
        // La FechaFin se define como 7 (si estamos en el 8) o 22 (si estamos en el 23) del mes siguiente
        const fechaInicioNueva = hoy.toISOString();
        const fechaFinNueva = new Date(hoy.getFullYear(), hoy.getMonth() + (diaActual === 8 ? 0 : 1), (diaActual === 23 ? 22 : 7)).toISOString(); // Lógica temporal para un rango

        const nuevaConsolidacion = {
            FechaInicio: fechaInicioNueva,
            FechaFin: fechaFinNueva,
            CapitalEntrante: capitalCierre, // El capital entrante es el cierre de la anterior
            CapitalSaliente: 0,
            Observaciones: `Generación automática. Capital inicial transferido: ${capitalCierre}`,
            FechaGeneracion: hoy.toISOString(),
        };
        
        // 4. Inserción en la BBDD
        const { data: consolidacionCreada, error: createError } = await supabase
            .from("ConsolidacionCapital")
            .insert(nuevaConsolidacion)
            .select()
            .single();

        if (createError) {
            throw new Error(`Error al crear la nueva consolidación: ${createError.message}`);
        }
        
        // 5. Crear el REGISTRO de Capital Cierre
        if (capitalCierre !== 0) {
            await registroConsolidacionService.createRegistroConsolidacionService({
                IdConsolidacion: consolidacionCreada.IdConsolidacion, 
                FechaRegistro: hoy.toISOString(),
                TipoRegistro: "Ingreso", // <-- Usar el tipo determinado
                Estado: "Depositado",
                Descripcion: "Capital Cierre (Transferencia automática de período anterior)",
                Monto: capitalCierre, // <-- Usar el valor absoluto
            });
        }

        console.log('Comenzando procesamiento de gastos fijos...');
        await gastoFijoJobService.processFixedExpenses(consolidacionCreada.IdConsolidacion); 
        // ------------------


        return consolidacionCreada; // Devolvemos la nueva consolidación creada
    }

    return null; // No es día de cierre
};