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
exports.deleteRegistroConsolidacion = exports.updateRegistroConsolidacion = exports.getRegistroConsolidacionById = exports.getAllRegistrosConsolidacion = exports.createRegistroConsolidacion = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler");
// Importamos el validador Zod y el servicio
const registroconsolidacion_validator_1 = require("../validators/registroconsolidacion.validator");
const registroConsolidacionService = __importStar(require("../services/registroconsolidacion.service"));
// Crear registro de consolidación
exports.createRegistroConsolidacion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = registroconsolidacion_validator_1.registroConsolidacionSchema.parse(req.body);
    try {
        const nuevoRegistro = await registroConsolidacionService.createRegistroConsolidacionService(data, req.user.IdEmpresa);
        res.status(201).json(nuevoRegistro);
    }
    catch (error) {
        if (error.message.includes("Saldo insuficiente")) {
            return res.status(400).json({ success: false, error: error.message });
        }
        throw error;
    }
});
// Obtener todos los registros (con filtro opcional por idConsolidacion)
exports.getAllRegistrosConsolidacion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idConsolidacion = req.query.idConsolidacion ? Number(req.query.idConsolidacion) : undefined;
    const lista = await registroConsolidacionService.getAllRegistrosConsolidacionService(req.user.IdEmpresa, idConsolidacion);
    res.json(lista);
});
// Obtener registro por ID
exports.getRegistroConsolidacionById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const registro = await registroConsolidacionService.getRegistroConsolidacionByIdService(id, req.user.IdEmpresa);
    res.json(registro);
});
// Actualizar registro
exports.updateRegistroConsolidacion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const data = registroconsolidacion_validator_1.registroConsolidacionSchema.parse(req.body);
    const actualizado = await registroConsolidacionService.updateRegistroConsolidacionService(id, req.user.IdEmpresa, data);
    res.json(actualizado);
});
// Eliminar registro
exports.deleteRegistroConsolidacion = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const resultado = await registroConsolidacionService.deleteRegistroConsolidacionService(id, req.user.IdEmpresa);
    res.json(resultado);
});
