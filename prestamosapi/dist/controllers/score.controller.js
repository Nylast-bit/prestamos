"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recalcularScore = exports.getRanking = exports.getHistorialScore = exports.getScore = void 0;
const score_service_1 = require("../services/score.service");
const logger_1 = require("../utils/logger");
const getScore = async (req, res) => {
    try {
        const { idCliente } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const data = await (0, score_service_1.getScoreService)(idCliente, idEmpresa);
        res.json({ data });
    }
    catch (error) {
        logger_1.logger.error('Error en getScore:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
};
exports.getScore = getScore;
const getHistorialScore = async (req, res) => {
    try {
        const { idCliente } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const data = await (0, score_service_1.getHistorialScoreService)(idCliente, idEmpresa);
        res.json({ data });
    }
    catch (error) {
        logger_1.logger.error('Error en getHistorialScore:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
};
exports.getHistorialScore = getHistorialScore;
const getRanking = async (req, res) => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const data = await (0, score_service_1.getRankingService)(idEmpresa);
        res.json({ data });
    }
    catch (error) {
        logger_1.logger.error('Error en getRanking:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
};
exports.getRanking = getRanking;
const recalcularScore = async (req, res) => {
    try {
        const { idCliente } = req.params;
        const idEmpresa = req.user.IdEmpresa;
        const data = await (0, score_service_1.recalcularScoreService)(idCliente, idEmpresa);
        res.json({ data, message: 'Score recalculado con éxito' });
    }
    catch (error) {
        logger_1.logger.error('Error en recalcularScore:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
};
exports.recalcularScore = recalcularScore;
