import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";

interface PagoPersonalizadoData {
    idPrestamo: number;
    idConsolidacion: number;
    montoPagado: number;
    fechaPago: string;
    concepto: string;
    esLiquidacion?: boolean;
}

export const createPagoPersonalizadoService = async (data: PagoPersonalizadoData) => {
    const { idPrestamo, idConsolidacion, montoPagado, fechaPago, concepto, esLiquidacion } = data;

    // 1. Buscar el préstamo actual
    const { data: prestamo, error: errorPrestamo } = await supabase
        .from("Prestamo")
        .select("*")
        .eq("IdPrestamo", idPrestamo)
        .single();

    if (errorPrestamo || !prestamo) {
        throw new Error(`Error buscando el préstamo: ${errorPrestamo?.message || "No encontrado"}`);
    }

    if (prestamo.Estado === "Pagado" || prestamo.Estado === "Saldado") {
        throw new Error("Este préstamo ya está saldado.");
    }

    // 2. Calcular la "Barrera del Interés" según el tipo de cálculo
    const tipoCalculo = (prestamo.TipoCalculo || '').toLowerCase();
    const baseInteres = (tipoCalculo.includes('amortiza') || tipoCalculo.includes('solo_interes') || tipoCalculo.includes('solo')) 
        ? (prestamo.CapitalRestante || prestamo.MontoPrestado) 
        : prestamo.MontoPrestado;
    const interesGenerado = baseInteres * (prestamo.InteresPorcentaje / 100);

    const capitalRestanteActual = prestamo.CapitalRestante !== undefined && prestamo.CapitalRestante !== null ? prestamo.CapitalRestante : prestamo.MontoPrestado;
    const minimoLiquidacion = interesGenerado + (capitalRestanteActual * 0.5);

    // 3. Validación de montos según la modalidad (Pago regular vs Liquidación)
    if (esLiquidacion) {
        if (montoPagado < minimoLiquidacion) {
            throw new Error(`Para liquidar el préstamo se requiere el interés (RD$${interesGenerado.toFixed(2)}) más al menos el 50% del capital restante (Mínimo requerido: RD$${minimoLiquidacion.toFixed(2)}).`);
        }
    } else {
        if (montoPagado < interesGenerado) {
            throw new Error(`El pago (RD$${montoPagado}) no cubre el interés mínimo generado (RD$${interesGenerado.toFixed(2)}). Pago rechazado.`);
        }
    }

    // 4. Distribuir el dinero
    const abonoInteres = interesGenerado;
    const abonoCapital = montoPagado - interesGenerado;

    // Si es liquidación, el capital restante pasa a 0 y el préstamo queda Saldado/Pagado
    const nuevoCapitalRestante = esLiquidacion ? 0 : Math.max(0, capitalRestanteActual - abonoCapital);
    const estadoPrestamo = (esLiquidacion || nuevoCapitalRestante === 0) ? "Pagado" : prestamo.Estado;

    // 5. La magia del JSON (TablaPagos)
    let cuotasActualizadas: any[] = [];
    try {
        cuotasActualizadas = JSON.parse(prestamo.TablaPagos || "[]");
    } catch (e) {
        logger.error("Error parseando TablaPagos", e);
    }

    // Crear la entrada del pago personalizado que acabamos de realizar
    const entradaPagoRealizado = {
        numeroCuota: 0, // se renumerará abajo
        cuota: montoPagado,
        interes: abonoInteres,
        capital: abonoCapital,
        saldo: nuevoCapitalRestante,
        pagado: true,
        tipo: esLiquidacion ? 'liquidar' : 'personalizado'
    };

    // Insertar al frente del arreglo
    cuotasActualizadas.unshift(entradaPagoRealizado);

    if (esLiquidacion || nuevoCapitalRestante === 0) {
        // Al liquidar o saldar, eliminamos todas las cuotas pendientes futuras
        cuotasActualizadas = cuotasActualizadas.filter((c: any) => c.pagado);
    } else if (tipoCalculo.includes('solo_interes') || tipoCalculo.includes('solo')) {
        for (let i = 1; i < cuotasActualizadas.length; i++) {
            if (cuotasActualizadas[i].pagado) continue; // saltar cuotas ya pagadas
            const interesNuevo = nuevoCapitalRestante * (prestamo.InteresPorcentaje / 100);
            cuotasActualizadas[i].interes = interesNuevo;
            cuotasActualizadas[i].cuota = interesNuevo;
            cuotasActualizadas[i].capital = 0;
            cuotasActualizadas[i].saldo = nuevoCapitalRestante;
        }
    } else if (nuevoCapitalRestante > 0 && abonoCapital > 0) {
        // Para tipos estándar (capital+interes, amortizable): ajustar desde atrás
        let capitalPorDescontar = abonoCapital;

        for (let i = cuotasActualizadas.length - 1; i >= 1; i--) {
            if (capitalPorDescontar <= 0) break;
            if (cuotasActualizadas[i].pagado) continue;

            let cuota = cuotasActualizadas[i];

            if (capitalPorDescontar >= cuota.capital) {
                capitalPorDescontar -= cuota.capital;
                cuota.capital = 0;
                cuota.interes = 0;
                cuota.cuota = 0;
            } else {
                cuota.capital -= capitalPorDescontar;
                cuota.cuota -= capitalPorDescontar;
                capitalPorDescontar = 0;
            }
        }

        cuotasActualizadas = cuotasActualizadas.filter((c: any) => c.pagado || c.cuota > 0);

        let saldoAcumulado = nuevoCapitalRestante;
        for (let i = 0; i < cuotasActualizadas.length; i++) {
            if (cuotasActualizadas[i].pagado) continue;
            saldoAcumulado -= cuotasActualizadas[i].capital;
            cuotasActualizadas[i].saldo = Math.max(0, saldoAcumulado);
        }
    }

    // Renumerar todas las cuotas secuencialmente
    cuotasActualizadas.forEach((c: any, i: number) => {
        c.numeroCuota = i + 1;
    });

    // Contar cuotas pendientes (las que NO están pagadas)
    const cuotasPendientes = cuotasActualizadas.filter((c: any) => !c.pagado).length;

    // Volvemos a convertir el JSON a string para guardarlo en Supabase
    const tablaPagosString = JSON.stringify(cuotasActualizadas);
    const backupPrestamo = {
        CapitalRestante: prestamo.CapitalRestante,
        Estado: prestamo.Estado,
        TablaPagos: prestamo.TablaPagos, // El string JSON original
        CuotasRestantes: prestamo.CuotasRestantes
    };

    // 6. Actualizar el Préstamo (Primer disparo)
    const { error: errorUpdatePrestamo } = await supabase
        .from("Prestamo")
        .update({
            CapitalRestante: nuevoCapitalRestante,
            Estado: estadoPrestamo,
            TablaPagos: tablaPagosString,
            CuotasRestantes: cuotasPendientes,
            FechaUltimoPago: fechaPago
        })
        .eq("IdPrestamo", idPrestamo);

    if (errorUpdatePrestamo) throw new Error(`Fallo al actualizar el préstamo: ${errorUpdatePrestamo.message}`);

    // 🛡️ ABRIMOS EL BLOQUE DE TRANSACCIÓN MANUAL 🛡️
    try {
        // La cuota del pago personalizado siempre es la primera entrada (numeroCuota = 1 si es el primer pago)
        const numeroCuotaReal = entradaPagoRealizado.numeroCuota; // ya fue renumerado arriba

        // 6.5 Calcular NumeroEmpresa secuencial para el Pago
        const { data: maxPago } = await supabase
            .from("Pago")
            .select("NumeroEmpresa, Prestamo!inner(IdEmpresa)")
            .eq("Prestamo.IdEmpresa", prestamo.IdEmpresa)
            .order("NumeroEmpresa", { ascending: false })
            .limit(1)
            .maybeSingle();

        const nextNumeroEmpresa = ((maxPago?.NumeroEmpresa) || 0) + 1;

        // 7. Crear el registro del Pago en la tabla general
        const { data: nuevoPago, error: errorPago } = await supabase
            .from("Pago")
            .insert([{
                IdPrestamo: idPrestamo,
                NumeroEmpresa: nextNumeroEmpresa,
                FechaPago: fechaPago,
                TipoPago: "Personalizado",
                MontoPagado: montoPagado,
                MontoInteresPagado: abonoInteres,
                MontoCapitalAbonado: abonoCapital,
                CuotasRestantes: cuotasPendientes,
                Observaciones: concepto,
                NumeroCuota: numeroCuotaReal
            }])
            .select()
            .single();

        if (errorPago) throw new Error(`Error en tabla Pago: ${errorPago.message}`);

        // 8. Crear el Registro en Consolidación
        const { error: errorConsolidacion } = await supabase
            .from("RegistroConsolidacion")
            .insert([{
                IdConsolidacion: idConsolidacion,
                FechaRegistro: fechaPago,
                TipoRegistro: "Ingreso",
                Estado: "Depositado",
                Descripcion: `Pago Personalizado - Préstamo #${idPrestamo} - ${concepto}`,
                Monto: montoPagado
            }]);

        if (errorConsolidacion) throw new Error(`Error en Consolidación: ${errorConsolidacion.message}`);

        // SI LLEGAMOS AQUÍ, TODO SALIÓ PERFECTO
        return {
            pago: nuevoPago,
            desglose: {
                interesCobrado: abonoInteres,
                capitalRebajado: abonoCapital,
                nuevoCapitalRestante: nuevoCapitalRestante
            }
        };

    } catch (error: any) {
        logger.error("FALLO DETECTADO. Revirtiendo cambios en el Préstamo...", error.message);

        await supabase
            .from("Prestamo")
            .update(backupPrestamo) // Le inyectamos la foto original
            .eq("IdPrestamo", idPrestamo);

        // Le avisamos al frontend que la operación fue abortada para no descuadrar la caja
        throw new Error(`Transacción abortada por error de base de datos. El préstamo no fue modificado. Detalle: ${error.message}`);
    }
};

export const getAllPagosPersonalizadosService = async (idEmpresa: number) => {
    // Pagos personalizados se guardan con TipoPago = "Personalizado"
    // Filtramos por empresa usando Prestamo!inner para filtro directo en DB
    const { data: pagos, error } = await supabase
        .from("Pago")
        .select(`
            *,
            Prestamo!inner (
                IdPrestamo,
                IdEmpresa,
                FechaInicio,
                FechaFinEstimada,
                CapitalRestante,
                CantidadCuotas,
                MontoCuota,
                TipoCalculo,
                InteresPorcentaje,
                Prestatario (
                    Nombre
                )
            )
        `)
        .eq("TipoPago", "Personalizado")
        .eq("Prestamo.IdEmpresa", idEmpresa)
        .order("FechaPago", { ascending: false });

    if (error) {
        throw new Error(`Error al obtener los pagos personalizados: ${error.message}`);
    }

    return pagos;
};