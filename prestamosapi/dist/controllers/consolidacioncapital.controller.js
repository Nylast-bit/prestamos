"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConsolidacionCapital = exports.updateConsolidacionCapital = exports.getConsolidacionCapitalById = exports.getAllConsolidacionesCapital = exports.createConsolidacionCapital = void 0;
const client_1 = __importDefault(require("../prisma/client"));
// Crear consolidación de capital
const createConsolidacionCapital = async (req, res) => {
    try {
        const data = req.body;
        const nuevo = await client_1.default.consolidacionCapital.create({
            data: {
                FechaInicio: data.FechaInicio ? new Date(data.FechaInicio) : null,
                FechaFin: data.FechaFin ? new Date(data.FechaFin) : null,
                CapitalEntrante: data.CapitalEntrante,
                CapitalSaliente: data.CapitalSaliente,
                Observaciones: data.Observaciones || null,
                FechaGeneracion: new Date(data.FechaGeneracion),
            },
        });
        res.status(201).json(nuevo);
    }
    catch (error) {
        res.status(500).json({
            error: "Error creando consolidación de capital",
            details: error,
        });
    }
};
exports.createConsolidacionCapital = createConsolidacionCapital;
// Obtener todas las consolidaciones
const getAllConsolidacionesCapital = async (req, res) => {
    try {
        const lista = await client_1.default.consolidacionCapital.findMany({
            include: {
                Registros: true,
            },
        });
        res.json(lista);
    }
    catch (error) {
        res.status(500).json({
            error: "Error obteniendo consolidaciones de capital",
            details: error,
        });
    }
};
exports.getAllConsolidacionesCapital = getAllConsolidacionesCapital;
// Obtener una consolidación por ID
const getConsolidacionCapitalById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const consolidacion = await client_1.default.consolidacionCapital.findUnique({
            where: { IdConsolidacion: id },
            include: {
                Registros: true,
            },
        });
        if (!consolidacion) {
            return res.status(404).json({ error: "Consolidación no encontrada" });
        }
        res.json(consolidacion);
    }
    catch (error) {
        res.status(500).json({
            error: "Error buscando consolidación de capital",
            details: error,
        });
    }
};
exports.getConsolidacionCapitalById = getConsolidacionCapitalById;
// Actualizar consolidación
const updateConsolidacionCapital = async (req, res) => {
    const id = Number(req.params.id);
    const data = req.body;
    try {
        const actualizado = await client_1.default.consolidacionCapital.update({
            where: { IdConsolidacion: id },
            data: {
                FechaInicio: data.FechaInicio ? new Date(data.FechaInicio) : null,
                FechaFin: data.FechaFin ? new Date(data.FechaFin) : null,
                CapitalEntrante: data.CapitalEntrante,
                CapitalSaliente: data.CapitalSaliente,
                Observaciones: data.Observaciones || null,
                FechaGeneracion: new Date(data.FechaGeneracion),
            },
        });
        res.json(actualizado);
    }
    catch (error) {
        res.status(500).json({
            error: "Error actualizando consolidación de capital",
            details: error,
        });
    }
};
exports.updateConsolidacionCapital = updateConsolidacionCapital;
// Eliminar consolidación
const deleteConsolidacionCapital = async (req, res) => {
    const id = Number(req.params.id);
    try {
        await client_1.default.consolidacionCapital.delete({
            where: { IdConsolidacion: id },
        });
        res.json({ message: "Consolidación de capital eliminada" });
    }
    catch (error) {
        res.status(500).json({
            error: "Error eliminando consolidación de capital",
            details: error,
        });
    }
};
exports.deleteConsolidacionCapital = deleteConsolidacionCapital;
