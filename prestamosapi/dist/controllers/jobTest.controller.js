"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCheckAndCreateConsolidation = exports.runFixedExpenseProcessor = void 0;
const logger_1 = require("../utils/logger");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const gastoFijoJobService = __importStar(require("../services/gastofijojob.service"));
const capitalJobService = __importStar(require("../services/capitaljob.service")); // Incluimos el servicio de consolidación
// --- EJECUTAR PROCESAMIENTO DE GASTOS FIJOS (Manual) ---
exports.runFixedExpenseProcessor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idConsolidacion = Number(req.params.id);
    const idEmpresa = req.user?.IdEmpresa || 1;
    if (isNaN(idConsolidacion)) {
        return res.status(400).json({ error: "Debe proporcionar un ID de Consolidación válido." });
    }
    logger_1.logger.info(`\n\n=== 🧪 Ejecutando prueba manual de gastos fijos para ID: ${idConsolidacion} ===`);
    // 1. Ejecutar la lógica de negocio (el job)
    const resultado = await gastoFijoJobService.processFixedExpenses(idConsolidacion, idEmpresa);
    res.json({
        message: "Procesamiento de gastos fijos completado manualmente.",
        consolidacion_id: idConsolidacion,
        details: resultado,
    });
});
// --- EJECUTAR CIERRE DE CONSOLIDACIÓN (Manual) ---
// (Opcional, si quieres probar la lógica de transferencia de capital en cualquier momento)
exports.runCheckAndCreateConsolidation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    logger_1.logger.info('\n\n=== 🧪 Ejecutando prueba manual de Cierre/Apertura de Consolidación ===');
    const idEmpresa = req.user?.IdEmpresa || 1;
    // Esta función encapsula la lógica de verificación de día (8 o 23) y creación.
    const nuevaConsolidacion = await capitalJobService.checkAndCreateConsolidation(idEmpresa);
    if (nuevaConsolidacion) {
        res.json({
            message: "Nueva consolidación creada con transferencia de capital.",
            IdConsolidacion: nuevaConsolidacion.IdConsolidacion,
            CapitalInicial: nuevaConsolidacion.CapitalEntrante
        });
    }
    else {
        res.status(200).json({
            message: "No es día de cierre (8 o 23). No se creó una nueva consolidación.",
        });
    }
});
