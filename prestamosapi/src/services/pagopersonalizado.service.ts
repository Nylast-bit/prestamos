import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";

interface PagoPersonalizadoData {
    idPrestamo: number;
    idConsolidacion: number;
    montoPagado: number;
    fechaPago: string;
    concepto: string;
}

export const createPagoPersonalizadoService = async (data: PagoPersonalizadoData) => {
    const { idPrestamo, idConsolidacion, montoPagado, fechaPago, concepto } = data;

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
    // capital+interes: interés FIJO basado en MontoPrestado original
    // amortizable: interés VARIABLE basado en CapitalRestante actual
    const tipoCalculo = (prestamo.TipoCalculo || '').toLowerCase();
    const baseInteres = (tipoCalculo.includes('amortiza') || tipoCalculo.includes('solo_interes') || tipoCalculo.includes('solo')) 
        ? (prestamo.CapitalRestante || prestamo.MontoPrestado) 
        : prestamo.MontoPrestado;
    const interesGenerado = baseInteres * (prestamo.InteresPorcentaje / 100);

    // 3. REGLA 1: No aceptar pagos menores al interés
    if (montoPagado < interesGenerado) {
        throw new Error(`El pago (RD$${montoPagado}) no cubre el interés mínimo generado (RD$${interesGenerado.toFixed(2)}). Pago rechazado.`);
    }

    // 4. Distribuir el dinero
    const abonoInteres = interesGenerado;
    const abonoCapital = montoPagado - interesGenerado;

    // Usamos CapitalRestante (como está en tu DB)
    const nuevoCapitalRestante = Math.max(0, prestamo.CapitalRestante - abonoCapital);
    const estadoPrestamo = nuevoCapitalRestante === 0 ? "Pagado" : prestamo.Estado;

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
        tipo: 'personalizado'
    };

    // Insertar al frente del arreglo (este pago queda como la cuota más reciente pagada)
    cuotasActualizadas.unshift(entradaPagoRealizado);

    // Para préstamos de solo_interes: recalcular el interés de las cuotas pendientes
    // basado en el nuevo CapitalRestante
    if (tipoCalculo.includes('solo_interes') || tipoCalculo.includes('solo')) {
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

        // Filtramos las cuotas pendientes que quedaron en 0 (pagadas por adelantado)
        cuotasActualizadas = cuotasActualizadas.filter((c: any) => c.pagado || c.cuota > 0);

        // Recalculamos los saldos de las pendientes
        let saldoAcumulado = nuevoCapitalRestante;
        for (let i = 0; i < cuotasActualizadas.length; i++) {
            if (cuotasActualizadas[i].pagado) continue;
            saldoAcumulado -= cuotasActualizadas[i].capital;
            cuotasActualizadas[i].saldo = Math.max(0, saldoAcumulado);
        }
    }

    if (nuevoCapitalRestante === 0) {
        // Si saldó, solo dejamos las entradas de pagos realizados
        cuotasActualizadas = cuotasActualizadas.filter((c: any) => c.pagado);
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
            CuotasRestantes: cuotasPendientes
        })
        .eq("IdPrestamo", idPrestamo);

    if (errorUpdatePrestamo) throw new Error(`Fallo al actualizar el préstamo: ${errorUpdatePrestamo.message}`);

    // 🛡️ ABRIMOS EL BLOQUE DE TRANSACCIÓN MANUAL 🛡️
    try {
        // La cuota del pago personalizado siempre es la primera entrada (numeroCuota = 1 si es el primer pago)
        const numeroCuotaReal = entradaPagoRealizado.numeroCuota; // ya fue renumerado arriba

        // 7. Crear el registro del Pago en la tabla general
        const { data: nuevoPago, error: errorPago } = await supabase
            .from("Pago")
            .insert([{
                IdPrestamo: idPrestamo,
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