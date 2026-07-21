"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHistorialPagos = exports.deletePago = exports.updatePago = exports.getProximaCuota = exports.getPagoById = exports.getAllPagos = exports.createPago = void 0;
const logger_1 = require("../utils/logger");
const supabaseClient_1 = require("../config/supabaseClient");
const pago_service_1 = require("../services/pago.service");
// 1. CREAR PAGO
const createPago = async (req, res) => {
    try {
        const { IdPrestamo, MontoPagado, TipoPago, Observaciones, MontoInteresPagado, MontoCapitalAbonado, NumeroCuota } = req.body;
        if (!IdPrestamo || !TipoPago || !MontoPagado) {
            return res.status(400).json({ error: "Datos incompletos." });
        }
        if (req.user?.Rol === 'Prestamista') {
            const { data: prestamo } = await supabaseClient_1.supabase
                .from('Prestamo')
                .select('IdPrestatario')
                .eq('IdPrestamo', Number(IdPrestamo))
                .eq('IdEmpresa', req.user.IdEmpresa)
                .maybeSingle();
            if (prestamo && req.user.IdPrestatario && prestamo.IdPrestatario !== req.user.IdPrestatario) {
                return res.status(403).json({ error: "Acceso denegado. Solo puedes registrar pagos en préstamos asignados a tu perfil de prestamista." });
            }
        }
        const resultado = await (0, pago_service_1.createPagoService)({
            IdPrestamo: Number(IdPrestamo),
            MontoPagado: Number(MontoPagado),
            TipoPago,
            Observaciones,
            MontoInteresPagado: Number(MontoInteresPagado),
            MontoCapitalAbonado: Number(MontoCapitalAbonado),
            NumeroCuota: Number(NumeroCuota)
        }, req.user.IdEmpresa);
        res.status(201).json({
            success: true,
            message: "Pago registrado exitosamente.",
            data: resultado
        });
    }
    catch (error) {
        logger_1.logger.error("Error en createPago:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.createPago = createPago;
// 2. OBTENER TODOS
const getAllPagos = async (req, res) => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const pagos = await (0, pago_service_1.getAllPagosService)(idEmpresa);
        res.json(pagos);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getAllPagos = getAllPagos;
// 3. OBTENER POR ID
const getPagoById = async (req, res) => {
    try {
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const pago = await (0, pago_service_1.getPagoByIdService)(Number(id), idEmpresa);
        res.json(pago);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getPagoById = getPagoById;
// 4. OBTENER PRÓXIMA CUOTA
const getProximaCuota = async (req, res) => {
    try {
        const { IdPrestamo } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const info = await (0, pago_service_1.getProximaCuotaService)(Number(IdPrestamo), idEmpresa);
        res.json(info);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getProximaCuota = getProximaCuota;
// 5. ACTUALIZAR PAGO
const updatePago = async (req, res) => {
    try {
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const data = req.body;
        const pago = await (0, pago_service_1.updatePagoService)(Number(id), idEmpresa, data);
        res.json(pago);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updatePago = updatePago;
// 6. ELIMINAR PAGO
const deletePago = async (req, res) => {
    try {
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        await (0, pago_service_1.deletePagoService)(Number(id), idEmpresa);
        res.json({ message: "Pago eliminado correctamente" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deletePago = deletePago;
const getHistorialPagos = async (req, res) => {
    try {
        const { id } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        if (!id) {
            return res.status(400).json({ error: "El ID del préstamo es obligatorio" });
        }
        const historial = await (0, pago_service_1.getHistorialPagosService)(Number(id), idEmpresa);
        return res.status(200).json(historial);
    }
    catch (error) {
        logger_1.logger.error("Error en getHistorialPagosController:", error);
        return res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
};
exports.getHistorialPagos = getHistorialPagos;
