import { supabase } from "../config/supabaseClient";
import * as registroConsolidacionService from './registroconsolidacion.service'; 
import * as gastoFijoJobService from './gastofijojob.service';

// --- HELPER: CALCULAR EL RANGO DE FECHAS SEGÚN REGLA DE NEGOCIO ---
// Regla: Periodo 1 (Día 8 al 22) | Periodo 2 (Día 23 al 7 del mes siguiente)
const calcularRangoFechas = (fechaActual: Date) => {
    const d = fechaActual.getDate();
    const m = fechaActual.getMonth();
    const y = fechaActual.getFullYear();

    let inicio: Date;
    let fin: Date;

    if (d >= 8 && d <= 22) {
        // ESTAMOS EN EL PERIODO 1 (Del 8 al 22 del mismo mes)
        inicio = new Date(y, m, 8, 0, 0, 0);
        fin = new Date(y, m, 22, 23, 59, 59, 999);
    } else if (d >= 23) {
        // ESTAMOS EN EL PERIODO 2 (Del 23 de este mes al 7 del SIGUIENTE)
        inicio = new Date(y, m, 23, 0, 0, 0);
        fin = new Date(y, m + 1, 7, 23, 59, 59, 999); // JS maneja el cambio de año solo
    } else {
        // ESTAMOS EN EL PERIODO 2 (Del 23 del ANTERIOR al 7 de este mes)
        // (Ejemplo: Hoy es día 5, pertenecemos al periodo que empezó el 23 pasado)
        inicio = new Date(y, m - 1, 23, 0, 0, 0);
        fin = new Date(y, m, 7, 23, 59, 59, 999);
    }

    return { 
        inicioISO: inicio.toISOString(), 
        finISO: fin.toISOString() 
    };
};

// --- FUNCIÓN PRINCIPAL ---
export const checkAndCreateConsolidation = async () => {
    const hoy = new Date();
    
    // 1. OBTENER LAS FECHAS CORRECTAS DEL PERIODO (GRANULARIDAD 1)
    const { inicioISO, finISO } = calcularRangoFechas(hoy);

    console.log(`🔍 Verificando consolidación para el periodo: ${inicioISO} al ${finISO}`);

    // 2. VERIFICAR SI YA EXISTE UNA CONSOLIDACIÓN EN ESTE RANGO
    const { data: existente } = await supabase
        .from("ConsolidacionCapital")
        .select("*")
        .eq("FechaInicio", inicioISO) // Buscamos coincidencia exacta de inicio
        .maybeSingle();

    if (existente) {
        console.log(`✅ Consolidación ya existe (ID: ${existente.IdConsolidacion}).`);
        return existente;
    }

    console.log("⚠️ Creando nueva consolidación para el periodo detectado...");

    // 3. OBTENER LA ÚLTIMA PARA ARRASTRAR EL BALANCE (GRANULARIDAD 2)
    // Buscamos la que cerró antes de que empiece la nueva
    const { data: ultima } = await supabase
        .from("ConsolidacionCapital")
        .select("IdConsolidacion, CapitalEntrante, CapitalSaliente")
        .lt("FechaInicio", inicioISO) // Que haya empezado antes de la nueva
        .order("FechaInicio", { ascending: false })
        .limit(1)
        .maybeSingle();

    // 4. CALCULAR BALANCE NETO EXACTO
    let balanceAnterior = 0;
    
    if (ultima) {
        const entradas = Number(ultima.CapitalEntrante) || 0;
        const salidas = Number(ultima.CapitalSaliente) || 0;
        balanceAnterior = entradas - salidas;

        // Cerramos la anterior visualmente (Opcional)
        // await supabase.from("ConsolidacionCapital").update({ Estado: "Cerrado" }).eq("IdConsolidacion", ultima.IdConsolidacion);
    }

    // 5. PREPARAR DATOS (AQUÍ MANEJAMOS EL SIGNO)
    const nuevaConsolidacionData = {
        FechaInicio: inicioISO,
        FechaFin: finISO,
        // Si el balance es negativo (-3000), entra tal cual (-3000) para que la matemática cuadre
        CapitalEntrante: balanceAnterior, 
        CapitalSaliente: 0,
        Observaciones: balanceAnterior < 0 
            ? `⚠️ Apertura con Déficit arrastrado: $${balanceAnterior.toFixed(2)}`
            : `Apertura normal. Saldo anterior: $${balanceAnterior.toFixed(2)}`,
        FechaGeneracion: hoy.toISOString()
    };

    // 6. INSERTAR EN BBDD
    const { data: nueva, error: createError } = await supabase
        .from("ConsolidacionCapital")
        .insert(nuevaConsolidacionData)
        .select()
        .single();

    if (createError) {
        console.error("❌ Error creando consolidación:", createError.message);
        throw new Error(`Error crítico creando consolidación: ${createError.message}`);
    }

    // 7. CREAR EL REGISTRO CONTABLE CORRECTO (CONTABILIDAD AMARRADA)
    // Aquí es donde solucionamos "que no puso el registro en negativo"
    if (balanceAnterior !== 0) {
        
        const esDeficit = balanceAnterior < 0;
        const montoAbsoluto = Math.abs(balanceAnterior);

        await registroConsolidacionService.createRegistroConsolidacionService({
            IdConsolidacion: nueva.IdConsolidacion, 
            FechaRegistro: hoy.toISOString(), // Registramos el movimiento hoy
            
            // Si es déficit (Negativo), lo registramos como Egreso o como Ingreso Negativo.
            // Para que se vea en rojo en tu tabla, lo ideal es:
            // Opción A: Tipo 'Egreso' con descripción 'Déficit Anterior'
            // Opción B: Tipo 'Ingreso' con monto negativo (Depende de cómo tu frontend sume)
            // Usaremos la lógica de Tipo según el signo para mayor claridad:
            
            TipoRegistro: esDeficit ? "Egreso" : "Ingreso", 
            Estado: "Procesado", // Estado fijo ya que es automático
            Descripcion: esDeficit 
                ? `🔻 Arrastre de Déficit (Periodo Anterior)` 
                : `✅ Saldo Inicial (Periodo Anterior)`,
            
            // Aquí aseguramos que el monto sea el correcto para tus cálculos
            // Si tu sistema resta los 'Egresos', mandamos el positivo absoluto.
            Monto: montoAbsoluto, 
        });
    }

    // 8. PROCESAR GASTOS FIJOS
    try {
        await gastoFijoJobService.processFixedExpenses(nueva.IdConsolidacion);
    } catch (e) {
        console.error("⚠️ Error procesando gastos fijos:", e);
    }

    console.log(`✅ Nueva Consolidación creada: ID ${nueva.IdConsolidacion} | Balance Inicial: ${balanceAnterior}`);
    return nueva;
};