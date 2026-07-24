"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPagosPersonalizadosService = exports.createPagoPersonalizadoService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const createPagoPersonalizadoService = async (data) => {
    const { idPrestamo, idConsolidacion, montoPagado, fechaPago, concepto, esLiquidacion, esAbonoExtraordinario } = data;
    // 1. Buscar el préstamo actual
    const { data: prestamo, error: errorPrestamo } = await supabaseClient_1.supabase
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
    // 2.5 Verificar si ya se cubrió el interés del período en la consolidación activa
    const { data: consolidacion } = await supabaseClient_1.supabase
        .from("ConsolidacionCapital")
        .select("FechaInicio, FechaFin")
        .eq("IdConsolidacion", idConsolidacion)
        .maybeSingle();
    let interesPagadoEnPeriodo = 0;
    if (consolidacion) {
        const { data: pagosPeriodo } = await supabaseClient_1.supabase
            .from("Pago")
            .select("MontoInteresPagado")
            .eq("IdPrestamo", idPrestamo)
            .gte("FechaPago", consolidacion.FechaInicio)
            .lte("FechaPago", consolidacion.FechaFin);
        if (pagosPeriodo) {
            interesPagadoEnPeriodo = pagosPeriodo.reduce((sum, p) => sum + Number(p.MontoInteresPagado || 0), 0);
        }
    }
    const yaPagoInteresPeriodo = interesPagadoEnPeriodo >= (interesGenerado - 0.01);
    let abonoInteres = 0;
    let abonoCapital = 0;
    // 3. Validación y distribución de montos según la modalidad
    if (esAbonoExtraordinario) {
        if (!yaPagoInteresPeriodo) {
            throw new Error(`El abono extraordinario a capital solo está permitido si ya se cubrió el interés del período (RD$${interesGenerado.toFixed(2)}). El interés acumulado en este período es RD$${interesPagadoEnPeriodo.toFixed(2)}.`);
        }
        if (montoPagado <= 0) {
            throw new Error("El monto del abono extraordinario debe ser mayor a RD$0.00.");
        }
        abonoInteres = 0; // 0% al interés (100% Directo a Capital)
        abonoCapital = Math.min(montoPagado, capitalRestanteActual);
    }
    else if (esLiquidacion) {
        if (montoPagado < minimoLiquidacion) {
            throw new Error(`Para liquidar el préstamo se requiere el interés (RD$${interesGenerado.toFixed(2)}) más al menos el 50% del capital restante (Mínimo requerido: RD$${minimoLiquidacion.toFixed(2)}).`);
        }
        abonoInteres = interesGenerado;
        abonoCapital = montoPagado - interesGenerado;
    }
    else {
        if (montoPagado < interesGenerado) {
            throw new Error(`El pago (RD$${montoPagado}) no cubre el interés mínimo generado (RD$${interesGenerado.toFixed(2)}). Pago rechazado.`);
        }
        abonoInteres = interesGenerado;
        abonoCapital = montoPagado - interesGenerado;
    }
    // Si es liquidación o el abono cubre todo el capital restante, el préstamo se marca como Pagado
    const nuevoCapitalRestante = (esLiquidacion || (capitalRestanteActual - abonoCapital <= 0)) ? 0 : Math.max(0, capitalRestanteActual - abonoCapital);
    const estadoPrestamo = (esLiquidacion || nuevoCapitalRestante === 0) ? "Pagado" : prestamo.Estado;
    // 5. La magia del JSON (TablaPagos)
    let cuotasActualizadas = [];
    try {
        cuotasActualizadas = JSON.parse(prestamo.TablaPagos || "[]");
    }
    catch (e) {
        logger_1.logger.error("Error parseando TablaPagos", e);
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
        cuotasActualizadas = cuotasActualizadas.filter((c) => c.pagado);
    }
    else if (tipoCalculo.includes('solo_interes') || tipoCalculo.includes('solo')) {
        for (let i = 1; i < cuotasActualizadas.length; i++) {
            if (cuotasActualizadas[i].pagado)
                continue; // saltar cuotas ya pagadas
            const interesNuevo = nuevoCapitalRestante * (prestamo.InteresPorcentaje / 100);
            cuotasActualizadas[i].interes = interesNuevo;
            cuotasActualizadas[i].cuota = interesNuevo;
            cuotasActualizadas[i].capital = 0;
            cuotasActualizadas[i].saldo = nuevoCapitalRestante;
        }
    }
    else if (nuevoCapitalRestante > 0 && abonoCapital > 0) {
        // Para tipos estándar (capital+interes, amortizable): ajustar desde atrás
        let capitalPorDescontar = abonoCapital;
        for (let i = cuotasActualizadas.length - 1; i >= 1; i--) {
            if (capitalPorDescontar <= 0)
                break;
            if (cuotasActualizadas[i].pagado)
                continue;
            let cuota = cuotasActualizadas[i];
            if (capitalPorDescontar >= cuota.capital) {
                capitalPorDescontar -= cuota.capital;
                cuota.capital = 0;
                cuota.interes = 0;
                cuota.cuota = 0;
            }
            else {
                cuota.capital -= capitalPorDescontar;
                cuota.cuota -= capitalPorDescontar;
                capitalPorDescontar = 0;
            }
        }
        cuotasActualizadas = cuotasActualizadas.filter((c) => c.pagado || c.cuota > 0);
        let saldoAcumulado = nuevoCapitalRestante;
        for (let i = 0; i < cuotasActualizadas.length; i++) {
            if (cuotasActualizadas[i].pagado)
                continue;
            saldoAcumulado -= cuotasActualizadas[i].capital;
            cuotasActualizadas[i].saldo = Math.max(0, saldoAcumulado);
        }
    }
    // Renumerar todas las cuotas secuencialmente
    cuotasActualizadas.forEach((c, i) => {
        c.numeroCuota = i + 1;
    });
    // Contar cuotas pendientes (las que NO están pagadas)
    const cuotasPendientes = cuotasActualizadas.filter((c) => !c.pagado).length;
    // Volvemos a convertir el JSON a string para guardarlo en Supabase
    const tablaPagosString = JSON.stringify(cuotasActualizadas);
    const backupPrestamo = {
        CapitalRestante: prestamo.CapitalRestante,
        Estado: prestamo.Estado,
        TablaPagos: prestamo.TablaPagos, // El string JSON original
        CuotasRestantes: prestamo.CuotasRestantes
    };
    // 6. Actualizar el Préstamo (Primer disparo)
    const { error: errorUpdatePrestamo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .update({
        CapitalRestante: nuevoCapitalRestante,
        Estado: estadoPrestamo,
        TablaPagos: tablaPagosString,
        CuotasRestantes: cuotasPendientes,
        FechaUltimoPago: fechaPago
    })
        .eq("IdPrestamo", idPrestamo);
    if (errorUpdatePrestamo)
        throw new Error(`Fallo al actualizar el préstamo: ${errorUpdatePrestamo.message}`);
    // 🛡️ ABRIMOS EL BLOQUE DE TRANSACCIÓN MANUAL 🛡️
    try {
        // La cuota del pago personalizado siempre es la primera entrada (numeroCuota = 1 si es el primer pago)
        const numeroCuotaReal = entradaPagoRealizado.numeroCuota; // ya fue renumerado arriba
        // 6.5 Calcular NumeroEmpresa secuencial para el Pago
        const { data: maxPago } = await supabaseClient_1.supabase
            .from("Pago")
            .select("NumeroEmpresa, Prestamo!inner(IdEmpresa)")
            .eq("Prestamo.IdEmpresa", prestamo.IdEmpresa)
            .order("NumeroEmpresa", { ascending: false })
            .limit(1)
            .maybeSingle();
        const nextNumeroEmpresa = ((maxPago?.NumeroEmpresa) || 0) + 1;
        const tipoPagoFinal = esAbonoExtraordinario ? "Extraordinario" : (esLiquidacion ? "Liquidacion" : "Personalizado");
        const descripcionConsolidacion = esAbonoExtraordinario
            ? `Abono Extraordinario a Capital - Préstamo #${idPrestamo} - ${concepto}`
            : (esLiquidacion
                ? `Liquidación Total - Préstamo #${idPrestamo} - ${concepto}`
                : `Pago Personalizado - Préstamo #${idPrestamo} - ${concepto}`);
        // 7. Crear el registro del Pago en la tabla general
        const { data: nuevoPago, error: errorPago } = await supabaseClient_1.supabase
            .from("Pago")
            .insert([{
                IdPrestamo: idPrestamo,
                NumeroEmpresa: nextNumeroEmpresa,
                FechaPago: fechaPago,
                TipoPago: tipoPagoFinal,
                MontoPagado: montoPagado,
                MontoInteresPagado: abonoInteres,
                MontoCapitalAbonado: abonoCapital,
                CuotasRestantes: cuotasPendientes,
                Observaciones: concepto,
                NumeroCuota: numeroCuotaReal
            }])
            .select()
            .single();
        if (errorPago)
            throw new Error(`Error en tabla Pago: ${errorPago.message}`);
        // 8. Crear el Registro en Consolidación
        const { error: errorConsolidacion } = await supabaseClient_1.supabase
            .from("RegistroConsolidacion")
            .insert([{
                IdConsolidacion: idConsolidacion,
                FechaRegistro: fechaPago,
                TipoRegistro: "Ingreso",
                Estado: "Depositado",
                Descripcion: descripcionConsolidacion,
                Monto: montoPagado
            }]);
        if (errorConsolidacion)
            throw new Error(`Error en Consolidación: ${errorConsolidacion.message}`);
        // SI LLEGAMOS AQUÍ, TODO SALIÓ PERFECTO
        return {
            pago: nuevoPago,
            desglose: {
                interesCobrado: abonoInteres,
                capitalRebajado: abonoCapital,
                nuevoCapitalRestante: nuevoCapitalRestante
            }
        };
    }
    catch (error) {
        logger_1.logger.error("FALLO DETECTADO. Revirtiendo cambios en el Préstamo...", error.message);
        await supabaseClient_1.supabase
            .from("Prestamo")
            .update(backupPrestamo) // Le inyectamos la foto original
            .eq("IdPrestamo", idPrestamo);
        // Le avisamos al frontend que la operación fue abortada para no descuadrar la caja
        throw new Error(`Transacción abortada por error de base de datos. El préstamo no fue modificado. Detalle: ${error.message}`);
    }
};
exports.createPagoPersonalizadoService = createPagoPersonalizadoService;
const getAllPagosPersonalizadosService = async (idEmpresa) => {
    // Pagos personalizados se guardan con TipoPago = "Personalizado"
    // Filtramos por empresa usando Prestamo!inner para filtro directo en DB
    const { data: pagos, error } = await supabaseClient_1.supabase
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
exports.getAllPagosPersonalizadosService = getAllPagosPersonalizadosService;
