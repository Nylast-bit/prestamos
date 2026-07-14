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
exports.getResumenConsolidacionActiva = exports.deleteConsolidacionCapital = exports.updateConsolidacionCapital = exports.getConsolidacionCapitalById = exports.getAllConsolidacionesCapital = exports.createConsolidacionCapital = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler");
const consolidacionService = __importStar(require("../services/consolidacioncapital.service")); // Asumo que importarás el servicio
// Crear consolidación de capital
exports.createConsolidacionCapital = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // La lógica de transformación de fechas fue movida al servicio
    const nuevo = await consolidacionService.createConsolidacionCapitalService(req.body, req.user.IdEmpresa);
    res.status(201).json(nuevo);
});
// Obtener todas las consolidaciones
exports.getAllConsolidacionesCapital = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const lista = await consolidacionService.getAllConsolidacionesCapitalService(req.user.IdEmpresa);
    res.json(lista);
});
// Obtener una consolidación por ID
exports.getConsolidacionCapitalById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    // El manejo de errores 404 fue movido al servicio (el servicio lanzará el error)
    const consolidacion = await consolidacionService.getConsolidacionCapitalByIdService(id, req.user.IdEmpresa);
    res.json(consolidacion);
});
// Actualizar consolidación
exports.updateConsolidacionCapital = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    // La lógica de transformación de fechas fue movida al servicio
    const actualizado = await consolidacionService.updateConsolidacionCapitalService(id, req.user.IdEmpresa, req.body);
    res.json(actualizado);
});
// Eliminar consolidación
exports.deleteConsolidacionCapital = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    // El manejo de errores fue movido al servicio
    const resultado = await consolidacionService.deleteConsolidacionCapitalService(id, req.user.IdEmpresa);
    res.json(resultado);
});
const getResumenConsolidacionActiva = async (req, res) => {
    try {
        const resumen = await consolidacionService.getResumenConsolidacionActivaService(req.user.IdEmpresa);
        // Respondemos con el JSON que espera el componente DashboardConsolidacion
        res.json(resumen);
    }
    catch (error) {
        res.status(500).json({
            error: "Error obteniendo el resumen de la consolidación activa",
            details: error.message
        });
    }
};
exports.getResumenConsolidacionActiva = getResumenConsolidacionActiva;
