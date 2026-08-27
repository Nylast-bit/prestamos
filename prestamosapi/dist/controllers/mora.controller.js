"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarMoraCliente = exports.getMorasPendientes = exports.getHistorialMora = exports.perdonarMora = exports.calcularMora = void 0;
const logger_1 = require("../utils/logger");
const mora_service_1 = require("../services/mora.service");
const calcularMora = async (req, res) => {
    try {
        const { idPrestamo } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const result = await (0, mora_service_1.calcularMoraService)(Number(idPrestamo), idEmpresa);
        res.json({ success: true, data: result });
    }
    catch (error) {
        logger_1.logger.error("Error en calcularMora:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.calcularMora = calcularMora;
const perdonarMora = async (req, res) => {
    try {
        const { idPrestamo } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const usuario = req.user.Nombre || "Usuario";
        await (0, mora_service_1.perdonarMoraService)(Number(idPrestamo), idEmpresa, usuario);
        res.json({ success: true, message: "Mora perdonada exitosamente" });
    }
    catch (error) {
        logger_1.logger.error("Error en perdonarMora:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.perdonarMora = perdonarMora;
const getHistorialMora = async (req, res) => {
    try {
        const { idPrestamo } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const result = await (0, mora_service_1.getHistorialMoraService)(Number(idPrestamo), idEmpresa);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Error en getHistorialMora:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getHistorialMora = getHistorialMora;
const getMorasPendientes = async (req, res) => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const result = await (0, mora_service_1.getMorasPendientesService)(idEmpresa);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Error en getMorasPendientes:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getMorasPendientes = getMorasPendientes;
const verificarMoraCliente = async (req, res) => {
    try {
        const { idCliente } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const result = await (0, mora_service_1.verificarMoraPendienteCliente)(Number(idCliente), idEmpresa);
        res.json(result);
    }
    catch (error) {
        logger_1.logger.error("Error en verificarMoraCliente:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.verificarMoraCliente = verificarMoraCliente;
