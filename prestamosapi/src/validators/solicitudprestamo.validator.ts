// src/validators/solicitudPrestamo.validator.ts
import { z } from "zod";

export const solicitudPrestamoSchema = z.object({
  IdCliente: z.number().min(1, "El cliente es obligatorio"),
  MontoSolicitado: z.number().min(1, "El monto solicitado debe ser mayor a 0"),
  FechaDeseada: z.string().min(1, "La fecha deseada es obligatoria"),
  Estado: z.string().min(1, "El estado es obligatorio"),
  Notas: z.string().optional(),
  FechaCreacion: z.string().min(1, "La fecha de creación es obligatoria"),
});
