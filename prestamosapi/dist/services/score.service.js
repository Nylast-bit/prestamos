"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalcularScoreService = exports.getRankingService = exports.getHistorialScoreService = exports.getScoreService = exports.actualizarScoreService = exports.getCategoriaRiesgo = void 0;
const supabaseClient_1 = require("../config/supabaseClient");
const logger_1 = require("../utils/logger");
const getCategoriaRiesgo = (puntaje) => {
    if (puntaje >= 850)
        return 'EXCELENTE';
    if (puntaje >= 700)
        return 'BUENO';
    if (puntaje >= 500)
        return 'REGULAR';
    if (puntaje >= 300)
        return 'BAJO';
    return 'CRITICO';
};
exports.getCategoriaRiesgo = getCategoriaRiesgo;
const actualizarScoreService = async (idCliente, idEmpresa, cambio, motivo, descripcion, idPrestamo) => {
    try {
        // Fetch current score
        const { data: cliente, error: errCliente } = await supabaseClient_1.supabase
            .from('Cliente')
            .select('PuntajeCredito')
            .eq('IdCliente', idCliente)
            .eq('IdEmpresa', idEmpresa)
            .single();
        if (errCliente && errCliente.code !== 'PGRST116') {
            throw new Error(errCliente.message);
        }
        const currentScore = cliente?.PuntajeCredito ?? 500;
        // Calculate new score (clamp 0-1000)
        let newScore = currentScore + cambio;
        if (newScore > 1000)
            newScore = 1000;
        if (newScore < 0)
            newScore = 0;
        const newCategory = (0, exports.getCategoriaRiesgo)(newScore);
        // Update Cliente
        const { error: errUpdate } = await supabaseClient_1.supabase
            .from('Cliente')
            .update({
            PuntajeCredito: newScore,
            CategoriaRiesgo: newCategory
        })
            .eq('IdCliente', idCliente)
            .eq('IdEmpresa', idEmpresa);
        if (errUpdate)
            throw new Error(errUpdate.message);
        // Insert ScoreLog
        const { error: errLog } = await supabaseClient_1.supabase
            .from('ScoreLog')
            .insert([{
                IdCliente: idCliente,
                IdEmpresa: idEmpresa,
                PuntajeAnterior: currentScore,
                PuntajeNuevo: newScore,
                Cambio: cambio,
                Motivo: motivo,
                Descripcion: descripcion,
                IdPrestamo: idPrestamo || null,
                Fecha: new Date().toISOString()
            }]);
        if (errLog) {
            logger_1.logger.error('Error insertando ScoreLog:', errLog.message);
        }
        return { puntaje: newScore, categoria: newCategory };
    }
    catch (error) {
        logger_1.logger.error('Error en actualizarScoreService:', error);
        throw error;
    }
};
exports.actualizarScoreService = actualizarScoreService;
const getScoreService = async (idCliente, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('Cliente')
        .select('PuntajeCredito, CategoriaRiesgo, TotalPrestamosCompletados, TotalCuotasATiempo, TotalCuotasAtrasadas, RachaPositiva')
        .eq('IdCliente', idCliente)
        .eq('IdEmpresa', idEmpresa)
        .single();
    if (error) {
        if (error.code === 'PGRST116') {
            return {
                PuntajeCredito: 500,
                CategoriaRiesgo: 'REGULAR',
                TotalPrestamosCompletados: 0,
                TotalCuotasATiempo: 0,
                TotalCuotasAtrasadas: 0,
                RachaPositiva: 0
            };
        }
        throw new Error(error.message);
    }
    return {
        PuntajeCredito: data.PuntajeCredito ?? 500,
        CategoriaRiesgo: data.CategoriaRiesgo ?? 'REGULAR',
        TotalPrestamosCompletados: data.TotalPrestamosCompletados ?? 0,
        TotalCuotasATiempo: data.TotalCuotasATiempo ?? 0,
        TotalCuotasAtrasadas: data.TotalCuotasAtrasadas ?? 0,
        RachaPositiva: data.RachaPositiva ?? 0
    };
};
exports.getScoreService = getScoreService;
const getHistorialScoreService = async (idCliente, idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('ScoreLog')
        .select('*')
        .eq('IdCliente', idCliente)
        .eq('IdEmpresa', idEmpresa)
        .order('Fecha', { ascending: false });
    if (error)
        throw new Error(error.message);
    return data || [];
};
exports.getHistorialScoreService = getHistorialScoreService;
const getRankingService = async (idEmpresa) => {
    const { data, error } = await supabaseClient_1.supabase
        .from('Cliente')
        .select('IdCliente, Nombre, Apellido, PuntajeCredito, CategoriaRiesgo')
        .eq('IdEmpresa', idEmpresa)
        .order('PuntajeCredito', { ascending: false });
    if (error)
        throw new Error(error.message);
    return data?.map(c => ({
        IdCliente: c.IdCliente,
        Nombre: c.Nombre,
        Apellido: c.Apellido,
        PuntajeCredito: c.PuntajeCredito ?? 500,
        CategoriaRiesgo: c.CategoriaRiesgo ?? 'REGULAR'
    })) || [];
};
exports.getRankingService = getRankingService;
const recalcularScoreService = async (idCliente, idEmpresa) => {
    // 1. Reset score to 500
    let puntaje = 500;
    // 2. Fetch all prestamos for this client
    const { data: prestamos, error: errPrestamos } = await supabaseClient_1.supabase
        .from('Prestamo')
        .select('IdPrestamo, TablaPagos, Estado, MontoMoraAcumulado, FechaInicio, ModalidadPago')
        .eq('IdCliente', idCliente)
        .eq('IdEmpresa', idEmpresa);
    if (errPrestamos)
        throw new Error(errPrestamos.message);
    let totalCuotasATiempo = 0;
    let totalCuotasAtrasadas = 0;
    let totalPrestamosCompletados = 0;
    let rachaPositiva = 0;
    if (prestamos && prestamos.length > 0) {
        for (const prestamo of prestamos) {
            if (prestamo.Estado === 'Pagado') {
                const moraAcumulada = prestamo.MontoMoraAcumulado ?? 0;
                if (moraAcumulada === 0) {
                    puntaje += 50; // Complete loan without mora
                    totalPrestamosCompletados++;
                    rachaPositiva++;
                    if (rachaPositiva >= 3) {
                        puntaje += 100; // Complete 3+ consecutive loans without mora
                        rachaPositiva = 0;
                    }
                }
                else {
                    rachaPositiva = 0; // broke the streak
                }
            }
            if (prestamo.TablaPagos) {
                let tabla = [];
                try {
                    tabla = typeof prestamo.TablaPagos === 'string' ? JSON.parse(prestamo.TablaPagos) : prestamo.TablaPagos;
                }
                catch (e) {
                    // ignore parsing error
                }
                for (const cuota of tabla) {
                    if (cuota.pagado && cuota.fechaPago) {
                        let fechaVenc = null;
                        if (cuota.fechaVencimiento) {
                            fechaVenc = new Date(cuota.fechaVencimiento);
                        }
                        else if (prestamo.FechaInicio && prestamo.ModalidadPago) {
                            const date = new Date(prestamo.FechaInicio);
                            date.setUTCHours(12, 0, 0, 0);
                            const modalidad = prestamo.ModalidadPago.toLowerCase();
                            const n = Number(cuota.numeroCuota || 1);
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
                        if (fechaVenc) {
                            const fechaVencimiento = new Date(fechaVenc);
                            const fechaPago = new Date(cuota.fechaPago);
                            // Normalize dates to start of day for comparison
                            fechaVencimiento.setUTCHours(0, 0, 0, 0);
                            fechaPago.setUTCHours(0, 0, 0, 0);
                            const diffTime = fechaPago.getTime() - fechaVencimiento.getTime();
                            const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
                            if (diffDays <= 0) {
                                if (diffDays < 0) {
                                    puntaje += 20; // Pay early
                                }
                                else {
                                    puntaje += 15; // Pay on time
                                }
                                totalCuotasATiempo++;
                            }
                            else if (diffDays >= 1 && diffDays <= 7) {
                                puntaje -= 10; // Pay late 1-7 days
                                totalCuotasAtrasadas++;
                            }
                            else if (diffDays > 7) {
                                puntaje -= 30; // Enter mora > 7 days
                                totalCuotasAtrasadas++;
                            }
                        } // close if(fechaVenc)
                    } // close if(cuota.pagado && cuota.fechaPago)
                } // close for(const cuota of tabla)
            } // close if(prestamo.TablaPagos)
        } // close for(const prestamo of prestamos)
    } // close if(prestamos && prestamos.length > 0)
    // clamp 0 - 1000
    if (puntaje > 1000)
        puntaje = 1000;
    if (puntaje < 0)
        puntaje = 0;
    const categoria = (0, exports.getCategoriaRiesgo)(puntaje);
    // 3. Update Cliente
    const { error: errUpdate } = await supabaseClient_1.supabase
        .from('Cliente')
        .update({
        PuntajeCredito: puntaje,
        CategoriaRiesgo: categoria,
        TotalPrestamosCompletados: totalPrestamosCompletados,
        TotalCuotasATiempo: totalCuotasATiempo,
        TotalCuotasAtrasadas: totalCuotasAtrasadas,
        RachaPositiva: rachaPositiva
    })
        .eq('IdCliente', idCliente)
        .eq('IdEmpresa', idEmpresa);
    if (errUpdate)
        throw new Error(errUpdate.message);
    // 4. Log RECALCULO
    await supabaseClient_1.supabase
        .from('ScoreLog')
        .insert([{
            IdCliente: idCliente,
            IdEmpresa: idEmpresa,
            PuntajeAnterior: null,
            PuntajeNuevo: puntaje,
            Cambio: 0,
            Motivo: 'RECALCULO',
            Descripcion: 'Recálculo completo de historial',
            IdPrestamo: null,
            Fecha: new Date().toISOString()
        }]);
    return { puntaje, categoria };
};
exports.recalcularScoreService = recalcularScoreService;
