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
exports.deleteGastoFijo = exports.updateGastoFijo = exports.getGastoFijoById = exports.getAllGastosFijos = exports.createGastoFijo = void 0;
const asyncHandler_1 = require("../middlewares/asyncHandler"); // Asumo que lo tienes
const gastoFijoService = __importStar(require("../services/gastofijo.service")); // Importamos el nuevo servicio
// Crear gasto fijo
exports.createGastoFijo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = req.body;
    data.IdEmpresa = req.user.IdEmpresa;
    const nuevo = await gastoFijoService.createGastoFijoService(data);
    res.status(201).json(nuevo);
});
// Obtener todos los gastos fijos
exports.getAllGastosFijos = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const idEmpresa = req.user.IdEmpresa;
    const lista = await gastoFijoService.getAllGastosFijosService(idEmpresa);
    res.json(lista);
});
// Obtener gasto fijo por id
exports.getGastoFijoById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const gasto = await gastoFijoService.getGastoFijoByIdService(id, idEmpresa);
    res.json(gasto);
});
// Actualizar gasto fijo
exports.updateGastoFijo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const data = req.body;
    if (data.IdEmpresa)
        delete data.IdEmpresa;
    const actualizado = await gastoFijoService.updateGastoFijoService(id, idEmpresa, data);
    res.json(actualizado);
});
// Eliminar gasto fijo
exports.deleteGastoFijo = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    const resultado = await gastoFijoService.deleteGastoFijoService(id, idEmpresa);
    res.json(resultado);
});
