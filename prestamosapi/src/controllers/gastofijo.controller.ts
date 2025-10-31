import { Request, Response } from "express";
import prisma from "../prisma/client";

// Crear gasto fijo
export const createGastoFijo = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const nuevo = await prisma.gastoFijo.create({
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
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creando gasto fijo", details: error });
  }
};

// Obtener todos los gastos fijos
export const getAllGastosFijos = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.gastoFijo.findMany();
    res.json(lista);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error obteniendo gastos fijos", details: error });
  }
};

// Obtener gasto fijo por id
export const getGastoFijoById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const gasto = await prisma.gastoFijo.findUnique({
      where: { IdGasto: id },
    });
    if (!gasto)
      return res.status(404).json({ error: "Gasto fijo no encontrado" });
    res.json(gasto);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error buscando gasto fijo", details: error });
  }
};

// Actualizar gasto fijo
export const updateGastoFijo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = req.body;
  try {
    const actualizado = await prisma.gastoFijo.update({
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
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error actualizando gasto fijo", details: error });
  }
};

// Eliminar gasto fijo
export const deleteGastoFijo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.gastoFijo.delete({ where: { IdGasto: id } });
    res.json({ message: "Gasto fijo eliminado" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error eliminando gasto fijo", details: error });
  }
};
