"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGastoFijo = exports.updateGastoFijo = exports.getGastoFijoById = exports.getAllGastosFijos = exports.createGastoFijo = void 0;
const client_1 = __importDefault(require("../prisma/client"));
// Crear gasto fijo
const createGastoFijo = async (req, res) => {
    try {
        const data = req.body;
        const nuevo = await client_1.default.gastoFijo.create({
            data: {
                Nombre: data.Nombre,
                Monto: data.Monto,
                Frecuencia: data.Frecuencia,
                Dia1: data.Dia1,
                Dia2: data.Dia2,
                Activo: data.Activo,
            },
        });
        res.status(201).json(nuevo);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error creando gasto fijo", details: error });
    }
};
exports.createGastoFijo = createGastoFijo;
// Obtener todos los gastos fijos
const getAllGastosFijos = async (req, res) => {
    try {
        const lista = await client_1.default.gastoFijo.findMany();
        res.json(lista);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error obteniendo gastos fijos", details: error });
    }
};
exports.getAllGastosFijos = getAllGastosFijos;
// Obtener gasto fijo por id
const getGastoFijoById = async (req, res) => {
    const id = Number(req.params.id);
    try {
        const gasto = await client_1.default.gastoFijo.findUnique({
            where: { IdGasto: id },
        });
        if (!gasto)
            return res.status(404).json({ error: "Gasto fijo no encontrado" });
        res.json(gasto);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error buscando gasto fijo", details: error });
    }
};
exports.getGastoFijoById = getGastoFijoById;
// Actualizar gasto fijo
const updateGastoFijo = async (req, res) => {
    const id = Number(req.params.id);
    const data = req.body;
    try {
        const actualizado = await client_1.default.gastoFijo.update({
            where: { IdGasto: id },
            data: {
                Nombre: data.Nombre,
                Monto: data.Monto,
                Frecuencia: data.Frecuencia,
                Dia1: data.Dia1,
                Dia2: data.Dia2,
                Activo: data.Activo,
            },
        });
        res.json(actualizado);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error actualizando gasto fijo", details: error });
    }
};
exports.updateGastoFijo = updateGastoFijo;
// Eliminar gasto fijo
const deleteGastoFijo = async (req, res) => {
    const id = Number(req.params.id);
    try {
        await client_1.default.gastoFijo.delete({ where: { IdGasto: id } });
        res.json({ message: "Gasto fijo eliminado" });
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Error eliminando gasto fijo", details: error });
    }
};
exports.deleteGastoFijo = deleteGastoFijo;
