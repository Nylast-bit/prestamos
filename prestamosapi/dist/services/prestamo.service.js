"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reengancharPrestamoService = exports.calcularSaldoPendientePrestamo = exports.countPrestamosActivosByPrestatarioService = exports.obtenerRangoCuotasService = exports.calcularTasaPorCuotaService = exports.opcionesSimularPrestamoService = exports.simularPrestamoService = exports.getPrestamoConDetallesService = exports.deletePrestamoService = exports.updatePrestamoService = exports.getPrestamoByIdService = exports.getPrestamosService = exports.createPrestamoService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const consolidacioncapital_service_1 = require("./consolidacioncapital.service");
// ==========================================
// 1. CRUD BÁSICO (Ya lo tenías, lo mantengo)
// ==========================================
const createPrestamoService = async (data, idEmpresa, isSuperAdmin = false) => {
    if (!isSuperAdmin) {
        const { data: suscripcion } = await supabaseClient_1.supabase
            .from('Suscripcion')
            .select('Plan:IdPlan (LimitePrestamos)')
            .eq('IdEmpresa', idEmpresa)
            .eq('Estado', 'Activa')
            .order('IdSuscripcion', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (!suscripcion || !suscripcion.Plan) {
            throw new Error('La empresa no cuenta con una suscripción activa.');
        }
        const plan = Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan;
        const { count } = await supabaseClient_1.supabase
            .from('Prestamo')
            .select('*', { count: 'exact', head: true })
            .eq('IdEmpresa', idEmpresa)
            .eq('Estado', 'Activo');
        if ((count || 0) >= plan.LimitePrestamos) {
            throw new Error('Límite de préstamos activos de su plan excedido.');
        }
    }
    const hoy = new Date().toISOString();
    const fechaValidacion = data.FechaInicio ? new Date(data.FechaInicio).toISOString() : hoy;
    // 1. OBTENER O CREAR CAJA/CONSOLIDACIÓN ACTIVA PARA LA FECHA DEL PRÉSTAMO
    const idConsolidacionActiva = await (0, consolidacioncapital_service_1.getConsolidacionActivaId)(fechaValidacion, idEmpresa);
    const consolidacion = { IdConsolidacion: idConsolidacionActiva };
    // 1.5 VALIDACIÓN DE LIQUIDEZ Y SALDO DISPONIBLE EN CAJA
    const infoBalance = await (0, consolidacioncapital_service_1.getBalanceDisponibleActivoService)(idEmpresa, fechaValidacion);
    const balanceDisponible = infoBalance.balanceDisponible;
    const montoSolicitado = Number(data.MontoPrestado || 0);
    if (montoSolicitado > balanceDisponible) {
        const formattedBalance = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(balanceDisponible);
        const formattedMonto = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(montoSolicitado);
        throw new Error(`Saldo insuficiente en la consolidación activa. El balance disponible en caja es ${formattedBalance} y el préstamo requiere ${formattedMonto}.`);
    }
    // 2. Obtener Cliente
    const { data: cliente } = await supabaseClient_1.supabase
        .from("Cliente")
        .select("Nombre")
        .eq("IdCliente", data.IdCliente)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (!cliente)
        throw new Error("Cliente no encontrado.");
    // 2.5 Obtener el siguiente NumeroEmpresa secuencial
    const { data: maxPrestamo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("NumeroEmpresa")
        .eq("IdEmpresa", idEmpresa)
        .order("NumeroEmpresa", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextNumeroEmpresa = ((maxPrestamo?.NumeroEmpresa) || 0) + 1;
    const prestamoToInsert = {
        ...data,
        NumeroEmpresa: nextNumeroEmpresa
    };
    // 3. Crear Préstamo
    const { data: nuevoPrestamo, error: errorPrestamo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .insert(prestamoToInsert)
        .select()
        .single();
    if (errorPrestamo)
        throw new Error(errorPrestamo.message);
    // 4. Registrar Salida de dinero (Egreso)
    const { error: errorRegistro } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .insert({
        IdConsolidacion: consolidacion.IdConsolidacion,
        FechaRegistro: fechaValidacion,
        TipoRegistro: "Egreso",
        Estado: "Prestado",
        Descripcion: `Préstamo - ${cliente.Nombre}`,
        Monto: data.MontoPrestado,
    });
    if (errorRegistro)
        throw new Error(`Error contable: ${errorRegistro.message}`);
    return nuevoPrestamo;
};
exports.createPrestamoService = createPrestamoService;
const getPrestamosService = async (idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select(`*, Cliente(Nombre), Prestatario(Nombre), Pago(FechaPago, NumeroCuota)`)
        .eq("IdEmpresa", idEmpresa)
        .order("IdPrestamo", { ascending: false });
    if (error)
        throw new Error(error.message);
    return Promise.all(data.map(async (p) => {
        let estado = p.Estado;
        let cuotasRestantes = p.CuotasRestantes;
        let fechaUltimoPago = p.FechaUltimoPago;
        let needsUpdate = false;
        const updates = {};
        const pagos = p.Pago || [];
        const totalPagosCount = pagos.length;
        // A. Evaluar cuotas desde TablaPagos si está disponible
        if (p.TablaPagos) {
            try {
                const tabla = JSON.parse(p.TablaPagos);
                const pendientes = tabla.filter((c) => !c.pagado).length;
                if (pendientes !== cuotasRestantes && pendientes >= 0) {
                    cuotasRestantes = pendientes;
                    updates.CuotasRestantes = cuotasRestantes;
                    needsUpdate = true;
                }
            }
            catch (e) { /* fallback */ }
        }
        // B. Verificar si el préstamo está completamente pagado
        const esSoloInteres = (p.TipoCalculo || '').toLowerCase().includes('solo_interes') || (p.TipoCalculo || '').toLowerCase().includes('solo');
        const capRestanteNum = p.CapitalRestante !== undefined && p.CapitalRestante !== null ? Number(p.CapitalRestante) : Number(p.MontoPrestado);
        let estaPagado = false;
        if (esSoloInteres) {
            // Los préstamos de solo interés NUNCA se pagan por cumplir número de cuotas de interés.
            // Únicamente se saldan cuando se paga el capital restante (esLiquidacion o abono total).
            estaPagado = capRestanteNum === 0;
        }
        else {
            estaPagado = (cuotasRestantes <= 0 && totalPagosCount >= (p.CantidadCuotas || 1)) || capRestanteNum === 0;
        }
        if (estaPagado && estado !== 'Pagado') {
            estado = 'Pagado';
            cuotasRestantes = 0;
            updates.Estado = 'Pagado';
            updates.CuotasRestantes = 0;
            needsUpdate = true;
        }
        else if (!estaPagado && estado === 'Pagado' && esSoloInteres) {
            // Si un préstamo de solo interés tenía capital activo pero figuraba como Pagado, corregirlo a Activo!
            estado = 'Activo';
            updates.Estado = 'Activo';
            needsUpdate = true;
        }
        // C. Sincronizar FechaUltimoPago con el pago más reciente registrado
        if (totalPagosCount > 0) {
            const sortedPagos = [...pagos].sort((a, b) => new Date(b.FechaPago).getTime() - new Date(a.FechaPago).getTime());
            const fechaUltimoPagoCalculada = sortedPagos[0].FechaPago;
            if (!fechaUltimoPago || new Date(fechaUltimoPagoCalculada).getTime() > new Date(fechaUltimoPago).getTime()) {
                fechaUltimoPago = fechaUltimoPagoCalculada;
                updates.FechaUltimoPago = fechaUltimoPago;
                needsUpdate = true;
            }
        }
        // D. Si hubo inconsistencias, persistir la corrección en Supabase en segundo plano
        if (needsUpdate) {
            supabaseClient_1.supabase
                .from("Prestamo")
                .update(updates)
                .eq("IdPrestamo", p.IdPrestamo)
                .then(({ error: errUpd }) => {
                if (errUpd)
                    logger_1.logger.error(`Error al auto-reparar préstamo #${p.IdPrestamo}:`, errUpd.message);
                else
                    logger_1.logger.info(`✅ Préstamo #${p.IdPrestamo} sincronizado: Estado '${estado}', FechaUltimoPago '${fechaUltimoPago}'`);
            });
        }
        return {
            ...p,
            Estado: estado,
            CuotasRestantes: cuotasRestantes,
            FechaUltimoPago: fechaUltimoPago,
            clienteNombre: p.Cliente?.Nombre || 'N/A',
            prestatarioNombre: p.Prestatario?.Nombre || 'N/A'
        };
    }));
};
exports.getPrestamosService = getPrestamosService;
const getPrestamoByIdService = async (id, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select(`*, Cliente(*), Prestatario(*)`)
        .eq("IdPrestamo", id)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (error)
        throw new Error(error.message);
    return data;
};
exports.getPrestamoByIdService = getPrestamoByIdService;
const updatePrestamoService = async (id, idEmpresa, data) => {
    const { data: updated, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .update(data)
        .eq("IdPrestamo", id)
        .eq("IdEmpresa", idEmpresa)
        .select()
        .single();
    if (error)
        throw new Error(error.message);
    return updated;
};
exports.updatePrestamoService = updatePrestamoService;
const deletePrestamoService = async (id, idEmpresa) => {
    // Verificamos propiedad de la empresa primero
    const prest = await (0, exports.getPrestamoByIdService)(id, idEmpresa);
    if (!prest)
        throw new Error("No tienes permisos o no existe");
    // Primero borramos registros hijos para evitar errores de FK si no tienes Cascade
    await supabaseClient_1.supabase.from("Pago").delete().eq("IdPrestamo", id);
    await supabaseClient_1.supabase.from("Volantes").delete().eq("IdPrestamo", id);
    // Borrar préstamo
    const { error } = await supabaseClient_1.supabase.from("Prestamo").delete().eq("IdPrestamo", id);
    if (error)
        throw new Error(error.message);
    return true;
};
exports.deletePrestamoService = deletePrestamoService;
// ==========================================
// 2. FUNCIONES AVANZADAS (LAS QUE FALTABAN)
// ==========================================
// A. Obtener detalles completos para eliminar
const getPrestamoConDetallesService = async (id, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select(`
        IdPrestamo, MontoPrestado, Estado,
        Cliente (Nombre),
        Prestatario (Nombre),
        Pagos (IdPago),
        Acuerdos (IdAcuerdo),
        PagosPersonalizados (IdPagoPersonalizado),
        Volantes (IdVolante)
    `)
        .eq("IdPrestamo", id)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (error)
        throw new Error(error.message);
    if (!data)
        throw new Error("Préstamo no encontrado");
    return data;
};
exports.getPrestamoConDetallesService = getPrestamoConDetallesService;
// B. Lógica de Simulación Matemática
const simularPrestamoService = (params) => {
    const { monto, tasaInteres, numeroCuotas, tipoCalculo, cuotaDeseada } = params;
    let cuotas = [];
    let montoCuota = 0;
    let totalInteres = 0;
    let totalPagar = 0;
    const i = tasaInteres / 100;
    if (cuotaDeseada && cuotaDeseada > 0) {
        montoCuota = cuotaDeseada;
    }
    else if (tipoCalculo === "solo_interes") {
        // Solo Interés: La cuota obligatoria por periodo es exclusivamente el interés del principal
        montoCuota = monto * i;
    }
    else if (tipoCalculo === "amortizable") {
        if (i === 0) {
            montoCuota = monto / numeroCuotas;
        }
        else {
            montoCuota = monto * ((i * Math.pow(1 + i, numeroCuotas)) / (Math.pow(1 + i, numeroCuotas) - 1));
        }
    }
    else {
        // FLAT
        const interesPorCuota = monto * i;
        const capitalPorCuota = monto / numeroCuotas;
        montoCuota = capitalPorCuota + interesPorCuota;
    }
    if (tipoCalculo === "solo_interes") {
        const interesPorCuota = cuotaDeseada && cuotaDeseada > 0 ? cuotaDeseada : (monto * i);
        totalInteres = interesPorCuota * numeroCuotas;
        totalPagar = monto + totalInteres;
        let saldo = monto;
        for (let j = 1; j <= numeroCuotas; j++) {
            const esUltima = (j === numeroCuotas);
            const cap = esUltima ? saldo : 0;
            const interesPeriodo = interesPorCuota;
            const cuotaActual = interesPeriodo + cap;
            const nuevoSaldo = esUltima ? 0 : saldo;
            cuotas.push({
                numeroCuota: j,
                cuota: Number(cuotaActual.toFixed(2)),
                interes: Number(interesPeriodo.toFixed(2)),
                capital: Number(cap.toFixed(2)),
                saldo: Number(nuevoSaldo.toFixed(2))
            });
        }
    }
    else if (tipoCalculo === "amortizable") {
        let saldo = monto;
        totalPagar = montoCuota * numeroCuotas;
        totalInteres = totalPagar - monto;
        for (let j = 1; j <= numeroCuotas; j++) {
            const interesPeriodo = saldo * i;
            let capitalPeriodo = montoCuota - interesPeriodo;
            if (j === numeroCuotas) {
                capitalPeriodo = saldo;
            }
            let nuevoSaldo = saldo - capitalPeriodo;
            if (j === numeroCuotas || nuevoSaldo < 0)
                nuevoSaldo = 0;
            const cuotaActual = capitalPeriodo + interesPeriodo;
            cuotas.push({
                numeroCuota: j,
                cuota: Number(cuotaActual.toFixed(2)),
                interes: Number(interesPeriodo.toFixed(2)),
                capital: Number(capitalPeriodo.toFixed(2)),
                saldo: Number(nuevoSaldo.toFixed(2))
            });
            saldo = nuevoSaldo;
        }
    }
    else {
        // FLAT
        const interesPorCuota = monto * i;
        const capitalPorCuota = monto / numeroCuotas;
        totalInteres = (cuotaDeseada ? (cuotaDeseada - capitalPorCuota) : interesPorCuota) * numeroCuotas;
        totalPagar = monto + totalInteres;
        let saldo = monto;
        for (let j = 1; j <= numeroCuotas; j++) {
            let cap = capitalPorCuota;
            if (j === numeroCuotas)
                cap = saldo;
            saldo -= cap;
            const cuotaActual = cuotaDeseada ? cuotaDeseada : (cap + interesPorCuota);
            cuotas.push({
                numeroCuota: j,
                cuota: Number(cuotaActual.toFixed(2)),
                interes: Number((cuotaActual - cap).toFixed(2)),
                capital: Number(cap.toFixed(2)),
                saldo: saldo > 0 ? Number(saldo.toFixed(2)) : 0
            });
        }
    }
    return {
        montoSolicitado: monto,
        tasaInteres, // Guardar float real de precisión completa
        tasaDisplay: Number(tasaInteres.toFixed(2)), // Tasa formateada a 2 decimales para la UI
        numeroCuotas,
        tipoCalculo,
        montoCuota: Number(montoCuota.toFixed(2)),
        montoTotalInteres: Number(totalInteres.toFixed(2)),
        montoTotalAPagar: Number(totalPagar.toFixed(2)),
        tablaAmortizacion: cuotas
    };
};
exports.simularPrestamoService = simularPrestamoService;
// C. Opciones de Simulación (Generar varios escenarios)
const opcionesSimularPrestamoService = (params) => {
    // Generamos 3 opciones: la pedida, +2 cuotas, +4 cuotas (ejemplo)
    const opcionesCuotas = [params.numeroCuotas, params.numeroCuotas + 2, params.numeroCuotas + 4];
    const resultados = opcionesCuotas.map(n => {
        return (0, exports.simularPrestamoService)({
            monto: params.monto,
            tasaInteres: params.tasaInteres,
            numeroCuotas: n,
            tipoCalculo: 'capital+interes' // Por defecto para esta vista rápida
        });
    });
    return resultados;
};
exports.opcionesSimularPrestamoService = opcionesSimularPrestamoService;
// D. Calcular Tasa Inversa (Dado un monto de cuota, hallar el %)
const calcularTasaPorCuotaService = (params) => {
    const { monto, cuotaDeseada, numeroCuotas, tipoCalculo } = params;
    let tasaEncontrada = 0;
    if (tipoCalculo === 'solo_interes') {
        // En solo_interes, la cuota deseada es la cuota de interés directo
        tasaEncontrada = (cuotaDeseada / monto) * 100;
    }
    else if (tipoCalculo === 'capital+interes') {
        const capitalMinimo = monto / numeroCuotas;
        if (cuotaDeseada <= capitalMinimo) {
            throw new Error(`La cuota deseada debe ser mayor a RD$ ${capitalMinimo.toFixed(2)} para cubrir el capital.`);
        }
        const interesMonto = cuotaDeseada - capitalMinimo;
        tasaEncontrada = (interesMonto / monto) * 100;
    }
    else {
        // Amortizable (Búsqueda Binaria de ultra alta precisión)
        const capitalMinimo = monto / numeroCuotas;
        if (cuotaDeseada <= capitalMinimo) {
            throw new Error(`La cuota deseada debe ser mayor a RD$ ${capitalMinimo.toFixed(2)} para cubrir el capital.`);
        }
        let low = 0;
        let high = 500;
        let epsilon = 0.00001; // Ultra preciso (0.001 centavo)
        for (let i = 0; i < 100; i++) {
            let mid = (low + high) / 2;
            const sim = (0, exports.simularPrestamoService)({
                monto, tasaInteres: mid, numeroCuotas, tipoCalculo: 'amortizable'
            });
            if (Math.abs(sim.montoCuota - cuotaDeseada) < epsilon) {
                tasaEncontrada = mid;
                break;
            }
            else if (sim.montoCuota < cuotaDeseada) {
                low = mid;
            }
            else {
                high = mid;
            }
            tasaEncontrada = mid;
        }
    }
    // Redondeamos a 4 decimales (estándar bancario/financiero) para evitar feos artefactos flotantes de 16 dígitos
    const tasaCuatroDecimales = Number(tasaEncontrada.toFixed(4));
    const simulacionAjustada = (0, exports.simularPrestamoService)({
        monto,
        tasaInteres: tasaCuatroDecimales,
        numeroCuotas,
        tipoCalculo,
        cuotaDeseada
    });
    return {
        ...simulacionAjustada,
        tasaCalculada: tasaCuatroDecimales,
        tasaInteres: tasaCuatroDecimales,
        tasaDisplay: Number(tasaCuatroDecimales.toFixed(2)),
        cuotaObjetivo: cuotaDeseada
    };
};
exports.calcularTasaPorCuotaService = calcularTasaPorCuotaService;
// E. Obtener Rango de Cuotas
const obtenerRangoCuotasService = (params) => {
    if (params.numeroCuotas <= 0)
        throw new Error("El número de cuotas debe ser un valor positivo");
    const cuotaMinima = params.monto / params.numeroCuotas; // 0% interés
    const cuotaMaximaSugerida = cuotaMinima * 2; // Ejemplo: hasta 100% de interés total (muy alto, pero es un techo)
    return {
        cuotaMinima: Number(cuotaMinima.toFixed(2)),
        cuotaMaximaSugerida: Number(cuotaMaximaSugerida.toFixed(2))
    };
};
exports.obtenerRangoCuotasService = obtenerRangoCuotasService;
const countPrestamosActivosByPrestatarioService = async (idPrestatario, idEmpresa) => {
    const { count, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("*", { count: "exact", head: true }) // 'head: true' significa "solo dame el número, no los datos"
        .eq("IdPrestatario", idPrestatario)
        .eq("IdEmpresa", idEmpresa)
        .eq("Estado", "Activo"); // O el estado que uses para definir 'Activo'
    if (error) {
        throw new Error(error.message);
    }
    return count || 0;
};
exports.countPrestamosActivosByPrestatarioService = countPrestamosActivosByPrestatarioService;
const calcularSaldoPendientePrestamo = (prestamo) => {
    if (prestamo.TipoCalculo === 'solo_interes') {
        return Number(prestamo.CapitalRestante ?? prestamo.MontoPrestado ?? 0);
    }
    if (prestamo.TablaPagos) {
        try {
            const tabla = JSON.parse(prestamo.TablaPagos);
            const pendientes = tabla.filter((c) => !c.pagado);
            if (pendientes.length > 0) {
                return pendientes.reduce((sum, c) => sum + Number(c.cuota || 0), 0);
            }
        }
        catch (e) { }
    }
    return Number(prestamo.CuotasRestantes || 0) * Number(prestamo.MontoCuota || 0);
};
exports.calcularSaldoPendientePrestamo = calcularSaldoPendientePrestamo;
const reengancharPrestamoService = async (idPrestamoOriginal, nuevoPrestamoData, idEmpresa, isSuperAdmin = false) => {
    // 1. Obtener Préstamo Original
    const { data: prestamoOriginal, error: errOrig } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("*")
        .eq("IdPrestamo", idPrestamoOriginal)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (errOrig || !prestamoOriginal) {
        throw new Error("El préstamo original a reenganchar no fue encontrado.");
    }
    if (prestamoOriginal.Estado === "Pagado" || prestamoOriginal.Estado === "Cancelado") {
        throw new Error("No se puede reenganchar un préstamo que ya está pagado o cancelado.");
    }
    // 2. Calcular el Saldo Pendiente del Préstamo Original
    const saldoPendienteOriginal = (0, exports.calcularSaldoPendientePrestamo)(prestamoOriginal);
    const nuevoMonto = Number(nuevoPrestamoData.MontoPrestado || 0);
    if (nuevoMonto <= saldoPendienteOriginal) {
        const format = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);
        throw new Error(`El nuevo préstamo (${format(nuevoMonto)}) debe ser mayor al saldo pendiente a liquidar (${format(saldoPendienteOriginal)}).`);
    }
    const efectivoNetoAEntregar = nuevoMonto - saldoPendienteOriginal;
    const hoyISO = new Date().toISOString();
    // 3. Validar Liquidez en Caja (Solo la diferencia real a entregar)
    const infoBalance = await (0, consolidacioncapital_service_1.getBalanceDisponibleActivoService)(idEmpresa, hoyISO);
    const balanceDisponible = infoBalance.balanceDisponible;
    if (efectivoNetoAEntregar > balanceDisponible) {
        const format = (n) => new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(n);
        throw new Error(`Saldo insuficiente en caja para el reenganche. El balance disponible es ${format(balanceDisponible)} y la diferencia en efectivo requerida es ${format(efectivoNetoAEntregar)}.`);
    }
    // 4. Calcular Valores Financieros y Tabla de Pagos del Nuevo Préstamo (ANTES de tocar la DB)
    const simulacion = (0, exports.simularPrestamoService)({
        monto: nuevoMonto,
        tasaInteres: Number(nuevoPrestamoData.InteresPorcentaje || 0),
        numeroCuotas: Number(nuevoPrestamoData.CantidadCuotas || 1),
        tipoCalculo: nuevoPrestamoData.TipoCalculo
    });
    const interesMontoTotal = nuevoPrestamoData.InteresMontoTotal ?? simulacion.montoTotalInteres;
    const capitalTotalPagar = nuevoPrestamoData.CapitalTotalPagar ?? simulacion.montoTotalAPagar;
    const montoCuota = nuevoPrestamoData.MontoCuota ?? simulacion.montoCuota;
    const tablaPagos = nuevoPrestamoData.TablaPagos || JSON.stringify(simulacion.tablaAmortizacion);
    const fechaInicioFinal = nuevoPrestamoData.FechaInicio || hoyISO;
    // Auto-calcular FechaFinEstimada según modalidad y cantidad de cuotas si no viene provista
    let fechaFinEstimadaFinal = nuevoPrestamoData.FechaFinEstimada;
    if (!fechaFinEstimadaFinal) {
        const dFin = new Date(fechaInicioFinal);
        const cuotasNum = Number(nuevoPrestamoData.CantidadCuotas || 1);
        const mod = (nuevoPrestamoData.ModalidadPago || "mensual").toLowerCase().trim();
        if (mod === "diario") {
            dFin.setDate(dFin.getDate() + cuotasNum);
        }
        else if (mod === "semanal") {
            dFin.setDate(dFin.getDate() + (cuotasNum * 7));
        }
        else if (mod === "quincenal") {
            dFin.setDate(dFin.getDate() + (cuotasNum * 15));
        }
        else {
            dFin.setMonth(dFin.getMonth() + cuotasNum);
        }
        fechaFinEstimadaFinal = dFin.toISOString();
    }
    const { data: maxPrestamo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("NumeroEmpresa")
        .eq("IdEmpresa", idEmpresa)
        .order("NumeroEmpresa", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextNumeroEmpresa = ((maxPrestamo?.NumeroEmpresa) || 0) + 1;
    const nuevoPrestamoPayload = {
        ...nuevoPrestamoData,
        IdCliente: prestamoOriginal.IdCliente,
        IdEmpresa: idEmpresa,
        NumeroEmpresa: nextNumeroEmpresa,
        Estado: "Activo",
        MontoPrestado: nuevoMonto,
        InteresMontoTotal: interesMontoTotal,
        CapitalTotalPagar: capitalTotalPagar,
        MontoCuota: montoCuota,
        CapitalRestante: nuevoMonto,
        CantidadCuotas: nuevoPrestamoData.CantidadCuotas,
        CuotasRestantes: nuevoPrestamoData.CantidadCuotas,
        TablaPagos: tablaPagos,
        FechaInicio: fechaInicioFinal,
        FechaFinEstimada: fechaFinEstimadaFinal,
        Observaciones: (nuevoPrestamoData.Observaciones ? nuevoPrestamoData.Observaciones + " | " : "") + `Creado por Reenganche del Préstamo #${prestamoOriginal.NumeroEmpresa ?? idPrestamoOriginal}`
    };
    // 5. PRIMERO INSERTAR EL NUEVO PRÉSTAMO. Si la inserción falla, el préstamo anterior NUNCA se altera.
    const { data: nuevoPrestamo, error: errNuevo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .insert(nuevoPrestamoPayload)
        .select()
        .single();
    if (errNuevo) {
        throw new Error("Error creando nuevo préstamo reenganchado: " + errNuevo.message);
    }
    // 6. AHORA SÍ LIQUIDAR EL PRÉSTAMO ORIGINAL
    let tablaOriginalActualizada = prestamoOriginal.TablaPagos;
    if (tablaOriginalActualizada) {
        try {
            const tabla = JSON.parse(tablaOriginalActualizada);
            tabla.forEach((c) => {
                if (!c.pagado) {
                    c.pagado = true;
                    c.fechaPago = hoyISO;
                    c.observacion = `Saldado por Reenganche a Préstamo #${nuevoPrestamo.NumeroEmpresa ?? nuevoPrestamo.IdPrestamo}`;
                }
            });
            tablaOriginalActualizada = JSON.stringify(tabla);
        }
        catch (e) { }
    }
    const { error: errUpdOrig } = await supabaseClient_1.supabase
        .from("Prestamo")
        .update({
        Estado: "Pagado",
        CuotasRestantes: 0,
        CapitalRestante: 0,
        FechaUltimoPago: hoyISO,
        TablaPagos: tablaOriginalActualizada,
        Observaciones: (prestamoOriginal.Observaciones ? prestamoOriginal.Observaciones + " | " : "") + `Liquidado por Reenganche a Préstamo #${nuevoPrestamo.NumeroEmpresa ?? nuevoPrestamo.IdPrestamo}`
    })
        .eq("IdPrestamo", idPrestamoOriginal);
    if (errUpdOrig) {
        logger_1.logger.error(`⚠️ Préstamo nuevo #${nuevoPrestamo.IdPrestamo} creado pero falló liquidar original #${idPrestamoOriginal}:`, errUpdOrig.message);
    }
    // 7. Registrar Egreso Neto en RegistroConsolidacion (diferenciaEfectivo)
    const idConsolidacionActiva = await (0, consolidacioncapital_service_1.getConsolidacionActivaId)(hoyISO, idEmpresa);
    const { data: cliente } = await supabaseClient_1.supabase
        .from("Cliente")
        .select("Nombre")
        .eq("IdCliente", prestamoOriginal.IdCliente)
        .single();
    const nombreCliente = cliente?.Nombre || "Cliente";
    const { error: errEgreso } = await supabaseClient_1.supabase
        .from("RegistroConsolidacion")
        .insert({
        IdConsolidacion: idConsolidacionActiva,
        FechaRegistro: hoyISO,
        TipoRegistro: "Egreso",
        Estado: "Prestado",
        Descripcion: `Reenganche Préstamo #${nuevoPrestamo.NumeroEmpresa ?? nuevoPrestamo.IdPrestamo} (Dif. entregada: ${efectivoNetoAEntregar}) - ${nombreCliente}`,
        Monto: efectivoNetoAEntregar
    });
    if (errEgreso) {
        logger_1.logger.error("Error al registrar egreso de reenganche en consolidación:", errEgreso.message);
    }
    return {
        prestamoOriginalLiquidado: idPrestamoOriginal,
        nuevoPrestamo,
        saldoPendienteOriginal,
        efectivoNetoAEntregar
    };
};
exports.reengancharPrestamoService = reengancharPrestamoService;
