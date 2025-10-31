// src/controllers/registroConsolidacion.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";
import { registroConsolidacionSchema } from "../validators/registroconsolidacion.validator";

// Crear registro de consolidación
export const createRegistroConsolidacion = async (req: Request, res: Response) => {
  try {
    const data = registroConsolidacionSchema.parse(req.body);

    // Validar que la consolidación exista
    const consolidacionExistente = await prisma.consolidacionCapital.findUnique({
      where: { IdConsolidacion: data.IdConsolidacion },
    });
    if (!consolidacionExistente)
      return res.status(400).json({ error: "Consolidación no encontrada" });

    const nuevoRegistro = await prisma.registroConsolidacion.create({
      data: {
        IdConsolidacion: data.IdConsolidacion,
        FechaRegistro: new Date(data.FechaRegistro),
        TipoRegistro: data.TipoRegistro,
        Estado: data.Estado,
        Descripcion: data.Descripcion,
        Monto: data.Monto,
      },
    });

    res.status(201).json(nuevoRegistro);
  } catch (error) {
    res.status(500).json({
      error: "Error creando registro de consolidación",
      details: error,
    });
  }
};

// Obtener todos los registros
export const getAllRegistrosConsolidacion = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.registroConsolidacion.findMany({
      include: { Consolidacion: true },
    });
    res.json(lista);
  } catch (error) {
    res.status(500).json({
      error: "Error obteniendo registros de consolidación",
      details: error,
    });
  }
};

// Obtener registro por ID
export const getRegistroConsolidacionById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const registro = await prisma.registroConsolidacion.findUnique({
      where: { IdRegistro: id },
      include: { Consolidacion: true },
    });

    if (!registro)
      return res.status(404).json({ error: "Registro no encontrado" });

    res.json(registro);
  } catch (error) {
    res.status(500).json({
      error: "Error buscando registro de consolidación",
      details: error,
    });
  }
};

// Actualizar registro
export const updateRegistroConsolidacion = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = registroConsolidacionSchema.parse(req.body);

    // Validar que la consolidación exista
    const consolidacionExistente = await prisma.consolidacionCapital.findUnique({
      where: { IdConsolidacion: data.IdConsolidacion },
    });
    if (!consolidacionExistente)
      return res.status(400).json({ error: "Consolidación no encontrada" });

    const actualizado = await prisma.registroConsolidacion.update({
      where: { IdRegistro: id },
      data: {
        IdConsolidacion: data.IdConsolidacion,
        FechaRegistro: new Date(data.FechaRegistro),
        TipoRegistro: data.TipoRegistro,
        Estado: data.Estado,
        Descripcion: data.Descripcion,
        Monto: data.Monto,
      },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({
      error: "Error actualizando registro de consolidación",
      details: error,
    });
  }
};

// Eliminar registro
export const deleteRegistroConsolidacion = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.registroConsolidacion.delete({ where: { IdRegistro: id } });
    res.json({ message: "Registro de consolidación eliminado" });
  } catch (error) {
    res.status(500).json({
      error: "Error eliminando registro de consolidación",
      details: error,
    });
  }
};
