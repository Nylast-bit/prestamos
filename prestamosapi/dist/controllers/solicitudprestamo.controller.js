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
exports.deleteSolicitudPrestamo = exports.updateSolicitudPrestamo = exports.getSolicitudPrestamoById = exports.getAllSolicitudesPrestamo = exports.createSolicitudPrestamo = void 0;
const solicitudprestamo_validator_1 = require("../validators/solicitudprestamo.validator");
const solicitudService = __importStar(require("../services/solicitudprestamo.service"));
// Crear solicitud de préstamo
const createSolicitudPrestamo = async (req, res) => {
    try {
        const data = solicitudprestamo_validator_1.solicitudPrestamoSchema.parse(req.body);
        const nuevaSolicitud = await solicitudService.createSolicitudService(data, req.user.IdEmpresa);
        res.status(201).json(nuevaSolicitud);
    }
    catch (error) {
        if (error.message === "Cliente no encontrado") {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Error creando solicitud de préstamo", details: error.message || error });
    }
};
exports.createSolicitudPrestamo = createSolicitudPrestamo;
// Obtener todas las solicitudes
const getAllSolicitudesPrestamo = async (req, res) => {
    try {
        const idEmpresa = req.user.IdEmpresa;
        const lista = await solicitudService.getAllSolicitudesService(idEmpresa);
        res.json(lista);
    }
    catch (error) {
        res.status(500).json({ error: "Error obteniendo solicitudes de préstamo", details: error.message || error });
    }
};
exports.getAllSolicitudesPrestamo = getAllSolicitudesPrestamo;
// Obtener solicitud por ID
const getSolicitudPrestamoById = async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    try {
        const solicitud = await solicitudService.getSolicitudByIdService(id, idEmpresa);
        res.json(solicitud);
    }
    catch (error) {
        if (error.message === "Solicitud no encontrada") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: "Error buscando solicitud de préstamo", details: error.message || error });
    }
};
exports.getSolicitudPrestamoById = getSolicitudPrestamoById;
// Actualizar solicitud
const updateSolicitudPrestamo = async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    try {
        const data = solicitudprestamo_validator_1.solicitudPrestamoSchema.parse(req.body);
        const actualizado = await solicitudService.updateSolicitudService(id, idEmpresa, data);
        res.json(actualizado);
    }
    catch (error) {
        if (error.message === "Cliente no encontrado") {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: "Error actualizando solicitud de préstamo", details: error.message || error });
    }
};
exports.updateSolicitudPrestamo = updateSolicitudPrestamo;
// Eliminar solicitud
const deleteSolicitudPrestamo = async (req, res) => {
    const id = Number(req.params.id);
    const idEmpresa = req.user.IdEmpresa;
    try {
        await solicitudService.deleteSolicitudService(id, idEmpresa);
        res.json({ message: "Solicitud de préstamo eliminada exitosamente" });
    }
    catch (error) {
        res.status(500).json({ error: "Error eliminando solicitud de préstamo", details: error.message || error });
    }
};
exports.deleteSolicitudPrestamo = deleteSolicitudPrestamo;
