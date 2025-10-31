// src/controllers/consolidacionCapital.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";

// Crear consolidación de capital
export const createConsolidacionCapital = async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const nuevo = await prisma.consolidacionCapital.create({
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
  } catch (error) {
    res.status(500).json({
      error: "Error creando consolidación de capital",
      details: error,
    });
  }
};

// Obtener todas las consolidaciones
export const getAllConsolidacionesCapital = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.consolidacionCapital.findMany({
      include: {
        Registros: true,
      },
    });
    res.json(lista);
  } catch (error) {
    res.status(500).json({
      error: "Error obteniendo consolidaciones de capital",
      details: error,
    });
  }
};

// Obtener una consolidación por ID
export const getConsolidacionCapitalById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const consolidacion = await prisma.consolidacionCapital.findUnique({
      where: { IdConsolidacion: id },
      include: {
        Registros: true,
      },
    });

    if (!consolidacion) {
      return res.status(404).json({ error: "Consolidación no encontrada" });
    }

    res.json(consolidacion);
  } catch (error) {
    res.status(500).json({
      error: "Error buscando consolidación de capital",
      details: error,
    });
  }
};

// Actualizar consolidación
export const updateConsolidacionCapital = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = req.body;

  try {
    const actualizado = await prisma.consolidacionCapital.update({
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
  } catch (error) {
    res.status(500).json({
      error: "Error actualizando consolidación de capital",
      details: error,
    });
  }
};

// Eliminar consolidación
export const deleteConsolidacionCapital = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    await prisma.consolidacionCapital.delete({
      where: { IdConsolidacion: id },
    });

    res.json({ message: "Consolidación de capital eliminada" });
  } catch (error) {
    res.status(500).json({
      error: "Error eliminando consolidación de capital",
      details: error,
    });
  }
};
