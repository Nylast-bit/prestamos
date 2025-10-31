import { Request, Response } from "express"
import prisma from "../prisma/client"

// Crear prestatario
export const createPrestatario = async (req: Request, res: Response) => {
  try {
    const data = req.body
    const nuevo = await prisma.prestatario.create({
      data: {
        Nombre: data.Nombre,
        Telefono: data.Telefono,
        Email: data.Email,
        Clave: data.Clave,
      }
    })
    res.status(201).json(nuevo)
  } catch (error) {
    res.status(500).json({ error: "Error creando prestatario", details: error })
  }
}

// Obtener todos los prestatarios
export const getAllPrestatarios = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.prestatario.findMany()
    res.json(lista)
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo prestatarios", details: error })
  }
}

// Obtener prestatario por id
export const getPrestatarioById = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
    const prestatario = await prisma.prestatario.findUnique({
      where: { IdPrestatario: id }
    })
    if (!prestatario) return res.status(404).json({ error: "Prestatario no encontrado" })
    res.json(prestatario)
  } catch (error) {
    res.status(500).json({ error: "Error buscando prestatario", details: error })
  }
}

// Actualizar prestatario
export const updatePrestatario = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const data = req.body
  try {
    const updated = await prisma.prestatario.update({
      where: { IdPrestatario: id },
      data: {
        Nombre: data.Nombre,
        Telefono: data.Telefono,
        Email: data.Email,
        Clave: data.Clave,
      }
    })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: "Error actualizando prestatario", details: error })
  }
}

// Eliminar prestatario
export const deletePrestatario = async (req: Request, res: Response) => {
  const id = Number(req.params.id)
  try {
    await prisma.prestatario.delete({ where: { IdPrestatario: id } })
    res.json({ message: "Prestatario eliminado" })
  } catch (error) {
    res.status(500).json({ error: "Error eliminando prestatario", details: error })
  }
}
