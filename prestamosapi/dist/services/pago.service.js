"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistorialPagosService = exports.updatePagoService = exports.deletePagoService = exports.getProximaCuotaService = exports.getPagoByIdService = exports.getAllPagosService = exports.createPagoService = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
// Asegúrate de importar el servicio de consolidación desde la ruta correcta
const registroconsolidacion_service_1 = require("./registroconsolidacion.service");
const score_service_1 = require("./score.service");
const createPagoService = async (data, idEmpresa) => {
    const { IdPrestamo, MontoPagado, TipoPago, Observaciones, MontoInteresPagado, MontoCapitalAbonado, NumeroCuota } = data;
    const totalDistribuido = Number(MontoCapitalAbonado || 0) + Number(MontoInteresPagado || 0);
    if (Math.abs(totalDistribuido - Number(MontoPagado)) > 0.01) {
        throw new Error(`La distribución del pago es incorrecta. Capital (${MontoCapitalAbonado}) + Interés (${MontoInteresPagado}) debe ser igual al monto pagado (${MontoPagado}).`);
    }
    logger_1.logger.info("--- INICIANDO SERVICIO DE PAGO ---");
    // 1. OBTENER INFO DEL PRÉSTAMO Y VALIDAR EMPRESA
    const { data: prestamo, error: errorPrestamo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("*")
        .eq("IdPrestamo", IdPrestamo)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (errorPrestamo || !prestamo) {
        throw new Error(`Préstamo no encontrado (ID: ${IdPrestamo})`);
    }
    // 2. 🔍 OBTENER NOMBRE DEL CLIENTE REAL (CORREGIDO)
    let nombreCliente = "Cliente Desconocido";
    if (prestamo.IdCliente) {
        // SOLO PEDIMOS "Nombre", porque "Apellido" NO EXISTE en tu tabla
        const { data: clienteData, error: errorCliente } = await supabaseClient_1.supabase
            .from("Cliente")
            .select("Nombre")
            .eq("IdCliente", prestamo.IdCliente)
            .single();
        if (errorCliente) {
            logger_1.logger.error("⚠️ Error buscando cliente:", errorCliente.message);
        }
        if (clienteData) {
            // Asignamos directamente el nombre
            nombreCliente = clienteData.Nombre || "Sin Nombre";
        }
    }
    logger_1.logger.info(`👤 Cliente identificado: ${nombreCliente}`);
    // 3. CÁLCULOS LÓGICOS Y ACTUALIZACIÓN DE TABLA DE PAGOS
    const cuotasPrevias = prestamo.CuotasRestantes;
    const nuevasCuotas = cuotasPrevias - 1;
    let cuotasParaGuardar = nuevasCuotas < 0 ? 0 : nuevasCuotas;
    const numeroCuotaReal = NumeroCuota || ((prestamo.CantidadCuotas - cuotasPrevias) + 1);
    const nowISO = new Date().toISOString();
    let tablaPagosString = prestamo.TablaPagos;
    if (tablaPagosString) {
        try {
            const tabla = JSON.parse(tablaPagosString);
            const cuotaIndex = tabla.findIndex((c) => c.numeroCuota === numeroCuotaReal || (!c.pagado && c.numeroCuota !== undefined));
            if (cuotaIndex !== -1) {
                tabla[cuotaIndex].pagado = true;
                tabla[cuotaIndex].fechaPago = nowISO;
            }
            else {
                const firstUnpaid = tabla.findIndex((c) => !c.pagado);
                if (firstUnpaid !== -1) {
                    tabla[firstUnpaid].pagado = true;
                    tabla[firstUnpaid].fechaPago = nowISO;
                }
            }
            tablaPagosString = JSON.stringify(tabla);
            const pendientes = tabla.filter((c) => !c.pagado).length;
            cuotasParaGuardar = pendientes;
        }
        catch (e) {
            logger_1.logger.error("Error parseando TablaPagos en createPagoService:", e);
        }
    }
    const nuevoCapitalRestante = Math.max(0, (prestamo.CapitalRestante !== undefined && prestamo.CapitalRestante !== null ? prestamo.CapitalRestante : prestamo.MontoPrestado) - Number(MontoCapitalAbonado || 0));
    const esSoloInteres = (prestamo.TipoCalculo || '').toLowerCase().includes('solo_interes') || (prestamo.TipoCalculo || '').toLowerCase().includes('solo');
    let nuevoEstado = prestamo.Estado;
    if (esSoloInteres) {
        if (nuevoCapitalRestante === 0) {
            nuevoEstado = 'Pagado';
        }
        else {
            nuevoEstado = 'Activo';
        }
    }
    else {
        if (cuotasParaGuardar === 0 || nuevoCapitalRestante === 0) {
            nuevoEstado = 'Pagado';
        }
    }
    // 3.5 Calcular NumeroEmpresa secuencial para el Pago
    const { data: maxPago } = await supabaseClient_1.supabase
        .from("Pago")
        .select("NumeroEmpresa, Prestamo!inner(IdEmpresa)")
        .eq("Prestamo.IdEmpresa", idEmpresa)
        .order("NumeroEmpresa", { ascending: false })
        .limit(1)
        .maybeSingle();
    const nextNumeroEmpresa = ((maxPago?.NumeroEmpresa) || 0) + 1;
    // 4. INSERTAR EL PAGO
    const { data: pagoRegistrado, error: errorPago } = await supabaseClient_1.supabase
        .from("Pago")
        .insert([{
            IdPrestamo,
            NumeroEmpresa: nextNumeroEmpresa,
            MontoPagado,
            TipoPago,
            Observaciones,
            FechaPago: nowISO,
            NumeroCuota: numeroCuotaReal,
            MontoInteresPagado,
            MontoCapitalAbonado,
            CuotasRestantes: cuotasParaGuardar
        }])
        .select()
        .single();
    if (errorPago)
        throw new Error("Error DB Pago: " + errorPago.message);
    // 5. ACTUALIZAR EL PRÉSTAMO
    const updatePayload = {
        CuotasRestantes: cuotasParaGuardar,
        CapitalRestante: nuevoCapitalRestante,
        Estado: nuevoEstado,
        FechaUltimoPago: nowISO
    };
    if (tablaPagosString) {
        updatePayload.TablaPagos = tablaPagosString;
    }
    const { error: errorUpdate } = await supabaseClient_1.supabase
        .from("Prestamo")
        .update(updatePayload)
        .eq("IdPrestamo", IdPrestamo);
    if (errorUpdate)
        throw new Error("Error update préstamo: " + errorUpdate.message);
    // 6. REGISTRO EN CONSOLIDACIÓN
    try {
        await (0, registroconsolidacion_service_1.createRegistroConsolidacionService)({
            IdPago: pagoRegistrado.IdPago,
            Monto: Number(MontoPagado),
            TipoRegistro: "Ingreso",
            Estado: "Pendiente",
            Descripcion: `Pago #${numeroCuotaReal} de ${nombreCliente}`,
            FechaRegistro: new Date()
        }, idEmpresa);
        logger_1.logger.info("✅ Registro de consolidación creado exitosamente.");
    }
    catch (errorConsolidacion) {
        logger_1.logger.error("⚠️ Alerta consolidación:", errorConsolidacion.message);
    }
    // 7. INTEGRACIÓN CON SISTEMA DE SCORE
    if (prestamo.IdCliente) {
        try {
            let cuotaPagada = null;
            if (tablaPagosString) {
                const tabla = JSON.parse(tablaPagosString);
                // Buscar la cuota recién pagada
                cuotaPagada = tabla.find((c) => c.numeroCuota === numeroCuotaReal) || tabla.find((c) => c.fechaPago === nowISO);
            }
            let puntajeCambio = 0;
            let motivo = '';
            let fechaVenc = null;
            if (cuotaPagada) {
                if (cuotaPagada.fechaVencimiento) {
                    fechaVenc = new Date(cuotaPagada.fechaVencimiento);
                }
                else if (prestamo.FechaInicio && prestamo.ModalidadPago) {
                    const date = new Date(prestamo.FechaInicio);
                    date.setUTCHours(12, 0, 0, 0);
                    const modalidad = prestamo.ModalidadPago.toLowerCase();
                    const n = Number(cuotaPagada.numeroCuota || numeroCuotaReal || 1);
                    if (modalidad === 'diario')
                        date.setDate(date.getDate() + n);
                    else if (modalidad === 'semanal')
                        date.setDate(date.getDate() + (n * 7));
                    else if (modalidad === 'quincenal')
                        date.setDate(date.getDate() + (n * 15));
                    else if (modalidad === 'mensual')
                        date.setMonth(date.getMonth() + n);
                    else if (modalidad === 'anual')
                        date.setFullYear(date.getFullYear() + n);
                    else
                        date.setMonth(date.getMonth() + n);
                    fechaVenc = date;
                }
            }
            if (fechaVenc) {
                const hoy = new Date();
                fechaVenc.setUTCHours(0, 0, 0, 0);
                hoy.setUTCHours(0, 0, 0, 0);
                const diffTime = hoy.getTime() - fechaVenc.getTime();
                const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
                if (diffDays <= 0) {
                    puntajeCambio = diffDays < 0 ? 20 : 15;
                    motivo = diffDays < 0 ? 'Pago anticipado' : 'Pago a tiempo';
                }
            }
            if (puntajeCambio > 0) {
                await (0, score_service_1.actualizarScoreService)(prestamo.IdCliente.toString(), idEmpresa, puntajeCambio, motivo, `Pago cuota #${numeroCuotaReal}`, prestamo.IdPrestamo);
                const { data: cliente } = await supabaseClient_1.supabase.from('Cliente').select('TotalCuotasATiempo').eq('IdCliente', prestamo.IdCliente).single();
                if (cliente) {
                    await supabaseClient_1.supabase.from('Cliente').update({
                        TotalCuotasATiempo: (cliente.TotalCuotasATiempo || 0) + 1
                    }).eq('IdCliente', prestamo.IdCliente);
                }
            }
            if (nuevoEstado === 'Pagado') {
                const moraAcumulada = prestamo.MontoMoraAcumulado || 0;
                const { data: cliente } = await supabaseClient_1.supabase.from('Cliente').select('TotalPrestamosCompletados, RachaPositiva').eq('IdCliente', prestamo.IdCliente).single();
                if (moraAcumulada === 0) {
                    await (0, score_service_1.actualizarScoreService)(prestamo.IdCliente.toString(), idEmpresa, 50, 'Préstamo sin mora', 'Préstamo completado sin atrasos', prestamo.IdPrestamo);
                    if (cliente) {
                        let nuevaRacha = (cliente.RachaPositiva || 0) + 1;
                        if (nuevaRacha >= 3) {
                            await (0, score_service_1.actualizarScoreService)(prestamo.IdCliente.toString(), idEmpresa, 100, 'Racha positiva', 'Completó 3 o más préstamos consecutivos sin mora', prestamo.IdPrestamo);
                            nuevaRacha = 0;
                        }
                        await supabaseClient_1.supabase.from('Cliente').update({
                            TotalPrestamosCompletados: (cliente.TotalPrestamosCompletados || 0) + 1,
                            RachaPositiva: nuevaRacha
                        }).eq('IdCliente', prestamo.IdCliente);
                    }
                }
                else {
                    if (cliente) {
                        await supabaseClient_1.supabase.from('Cliente').update({
                            TotalPrestamosCompletados: (cliente.TotalPrestamosCompletados || 0) + 1,
                            RachaPositiva: 0
                        }).eq('IdCliente', prestamo.IdCliente);
                    }
                }
            }
        }
        catch (errorScore) {
            logger_1.logger.error("⚠️ Error en sistema de score:", errorScore.message);
        }
    }
    return { pago: pagoRegistrado, nuevoEstado };
};
exports.createPagoService = createPagoService;
// 1. Obtener todos los pagos
const getAllPagosService = async (idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
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
        Cliente (
          Nombre
        )
      )
    `)
        .eq("Prestamo.IdEmpresa", idEmpresa)
        .order("FechaPago", { ascending: false });
    if (error) {
        throw new Error(`Error al obtener el historial de pagos: ${error.message}`);
    }
    return data;
};
exports.getAllPagosService = getAllPagosService;
// 2. Obtener un pago por ID
const getPagoByIdService = async (id, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from("Pago")
        .select(`
      *,
      Prestamo!inner(*)
    `)
        .eq("IdPago", id)
        .eq("Prestamo.IdEmpresa", idEmpresa)
        .single();
    if (error)
        throw new Error(error.message);
    return data;
};
exports.getPagoByIdService = getPagoByIdService;
// 3. Calcular Próxima Cuota (Solo lectura)
const getProximaCuotaService = async (idPrestamo, idEmpresa) => {
    const { data: prestamo, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("*")
        .eq("IdPrestamo", idPrestamo)
        .eq("IdEmpresa", idEmpresa)
        .single();
    if (error)
        throw new Error(error.message);
    const cuotaNumero = (prestamo.CantidadCuotas - prestamo.CuotasRestantes) + 1;
    // Aquí podrías leer la TablaPagos JSON si quieres exactitud, 
    // o devolver la cuota fija si es nivelada.
    return {
        IdPrestamo: idPrestamo,
        ProximaCuotaNumero: cuotaNumero,
        MontoCuota: prestamo.MontoCuota,
        FechaProximoPago: "Calculado en frontend" // O usa tu lógica de fechas aquí
    };
};
exports.getProximaCuotaService = getProximaCuotaService;
// 4. Eliminar Pago (Cuidado: esto debería revertir saldo, por ahora solo borra)
const deletePagoService = async (idPago, idEmpresa) => {
    logger_1.logger.info(`--- INICIANDO REVERSIÓN DEL PAGO #${idPago} ---`);
    // Validar seguridad obteniéndolo primero
    await (0, exports.getPagoByIdService)(idPago, idEmpresa);
    // 1. OBTENER DATOS DEL PAGO ANTES DE BORRARLO
    const { data: pago, error: errorPago } = await supabaseClient_1.supabase
        .from("Pago")
        .select("IdPrestamo, MontoPagado, MontoCapitalAbonado, NumeroCuota")
        .eq("IdPago", idPago)
        .single();
    if (errorPago || !pago) {
        throw new Error("No se encontró el pago original para revertir.");
    }
    // 2. OBTENER EL PRÉSTAMO ACTUAL
    const { data: prestamo, error: errorPrestamo } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("CuotasRestantes, Estado, CapitalRestante, MontoPrestado, TablaPagos")
        .eq("IdPrestamo", pago.IdPrestamo)
        .single();
    if (errorPrestamo || !prestamo) {
        throw new Error("No se encontró el préstamo asociado a este pago.");
    }
    // 3. CÁLCULO DE REVERSIÓN
    // Le devolvemos la cuota que había pagado
    const nuevasCuotas = prestamo.CuotasRestantes + 1;
    // Si estaba "Pagado", lo revivimos a "Activo"
    const nuevoEstado = prestamo.Estado === 'Pagado' ? 'Activo' : prestamo.Estado;
    // Restaurar CapitalRestante
    let nuevoCapitalRestante = (prestamo.CapitalRestante !== undefined && prestamo.CapitalRestante !== null ? prestamo.CapitalRestante : prestamo.MontoPrestado) + Number(pago.MontoCapitalAbonado || 0);
    if (nuevoCapitalRestante > prestamo.MontoPrestado)
        nuevoCapitalRestante = prestamo.MontoPrestado;
    // Revertir TablaPagos
    let nuevaTablaPagosString = prestamo.TablaPagos;
    if (nuevaTablaPagosString) {
        try {
            const tabla = JSON.parse(nuevaTablaPagosString);
            const cuotaIndex = tabla.findIndex((c) => c.numeroCuota === pago.NumeroCuota && c.pagado);
            if (cuotaIndex !== -1) {
                tabla[cuotaIndex].pagado = false;
                delete tabla[cuotaIndex].fechaPago;
            }
            nuevaTablaPagosString = JSON.stringify(tabla);
        }
        catch (e) {
            logger_1.logger.error("Error parseando TablaPagos en deletePagoService:", e);
        }
    }
    logger_1.logger.info(`Revertiendo Préstamo #${pago.IdPrestamo}: Cuotas subirán a ${nuevasCuotas}, Estado será ${nuevoEstado}`);
    // 4. ACTUALIZAR EL PRÉSTAMO
    const updatePayload = {
        CuotasRestantes: nuevasCuotas,
        Estado: nuevoEstado,
        CapitalRestante: nuevoCapitalRestante,
    };
    if (nuevaTablaPagosString) {
        updatePayload.TablaPagos = nuevaTablaPagosString;
    }
    const { error: errorUpdate } = await supabaseClient_1.supabase
        .from("Prestamo")
        .update(updatePayload)
        .eq("IdPrestamo", pago.IdPrestamo);
    if (errorUpdate) {
        throw new Error("Error restaurando las cuotas del préstamo: " + errorUpdate.message);
    }
    // 5. BORRAR EL PAGO (🔥 El ON DELETE CASCADE borrará la consolidación automáticamente)
    const { error: errorDelete } = await supabaseClient_1.supabase
        .from("Pago")
        .delete()
        .eq("IdPago", idPago);
    if (errorDelete) {
        // En caso raro de fallo, habría que revisar a mano, pero con Supabase es casi atómico.
        throw new Error("Error al eliminar el registro del pago: " + errorDelete.message);
    }
    logger_1.logger.info("--- REVERSIÓN COMPLETADA CON ÉXITO ---");
    return true;
};
exports.deletePagoService = deletePagoService;
// 5. Actualizar Pago (Básico - Solo observaciones o tipo)
const updatePagoService = async (id, idEmpresa, data) => {
    // Validar pertenencia
    await (0, exports.getPagoByIdService)(id, idEmpresa);
    const { data: pago, error } = await supabaseClient_1.supabase
        .from("Pago")
        .update(data)
        .eq("IdPago", id)
        .select()
        .single();
    if (error)
        throw new Error(error.message);
    return pago;
};
exports.updatePagoService = updatePagoService;
const getHistorialPagosService = async (idPrestamo, idEmpresa) => {
    // Validar que el prestamo me pertenezca
    const { data: prestamo } = await supabaseClient_1.supabase.from('Prestamo').select('IdPrestamo').eq('IdPrestamo', idPrestamo).eq('IdEmpresa', idEmpresa).single();
    if (!prestamo)
        throw new Error("Préstamo no encontrado");
    const { data, error } = await supabaseClient_1.supabase
        .from("Pago")
        .select("*")
        .eq("IdPrestamo", idPrestamo)
        .order("NumeroCuota", { ascending: true });
    if (error)
        throw new Error(error.message);
    return data;
};
exports.getHistorialPagosService = getHistorialPagosService;
