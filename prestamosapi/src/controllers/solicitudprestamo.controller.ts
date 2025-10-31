// src/controllers/solicitudPrestamo.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";
import { solicitudPrestamoSchema } from "../validators/solicitudprestamo.validator";

// Crear solicitud de préstamo
export const createSolicitudPrestamo = async (req: Request, res: Response) => {
  try {
    const data = solicitudPrestamoSchema.parse(req.body);

    // Validar que el cliente exista
    const clienteExistente = await prisma.cliente.findUnique({
      where: { IdCliente: data.IdCliente },
    });
    if (!clienteExistente)
      return res.status(400).json({ error: "Cliente no encontrado" });

    const nuevaSolicitud = await prisma.solicitudPrestamo.create({
      data: {
        IdCliente: data.IdCliente,
        MontoSolicitado: data.MontoSolicitado,
        FechaDeseada: new Date(data.FechaDeseada),
        Estado: data.Estado,
        Notas: data.Notas || null,
        FechaCreacion: new Date(data.FechaCreacion),
      },
    });

    res.status(201).json(nuevaSolicitud);
  } catch (error) {
    res.status(500).json({
      error: "Error creando solicitud de préstamo",
      details: error,
    });
  }
};

// Obtener todas las solicitudes
export const getAllSolicitudesPrestamo = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.solicitudPrestamo.findMany({
      include: {
        Cliente: true,
      },
    });
    res.json(lista);
  } catch (error) {
    res.status(500).json({
      error: "Error obteniendo solicitudes de préstamo",
      details: error,
    });
  }
};

// Obtener solicitud por ID
export const getSolicitudPrestamoById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const solicitud = await prisma.solicitudPrestamo.findUnique({
      where: { IdSolicitud: id },
      include: { Cliente: true },
    });

    if (!solicitud)
      return res.status(404).json({ error: "Solicitud no encontrada" });

    res.json(solicitud);
  } catch (error) {
    res.status(500).json({
      error: "Error buscando solicitud de préstamo",
      details: error,
    });
  }
};

// Actualizar solicitud
export const updateSolicitudPrestamo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    const data = solicitudPrestamoSchema.parse(req.body);

    // Validar que el cliente exista
    const clienteExistente = await prisma.cliente.findUnique({
      where: { IdCliente: data.IdCliente },
    });
    if (!clienteExistente)
      return res.status(400).json({ error: "Cliente no encontrado" });

    const actualizado = await prisma.solicitudPrestamo.update({
      where: { IdSolicitud: id },
      data: {
        IdCliente: data.IdCliente,
        MontoSolicitado: data.MontoSolicitado,
        FechaDeseada: new Date(data.FechaDeseada),
        Estado: data.Estado,
        Notas: data.Notas || null,
        FechaCreacion: new Date(data.FechaCreacion),
      },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({
      error: "Error actualizando solicitud de préstamo",
      details: error,
    });
  }
};

// Eliminar solicitud
export const deleteSolicitudPrestamo = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  try {
    await prisma.solicitudPrestamo.delete({ where: { IdSolicitud: id } });
    res.json({ message: "Solicitud de préstamo eliminada" });
  } catch (error) {
    res.status(500).json({
      error: "Error eliminando solicitud de préstamo",
      details: error,
    });
  }
};
