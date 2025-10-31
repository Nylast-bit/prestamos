// src/validators/registroConsolidacion.validator.ts
import { z } from "zod";

export const registroConsolidacionSchema = z.object({
  IdConsolidacion: z.number().min(1, "La consolidación es obligatoria"),
  FechaRegistro: z.string().min(1, "La fecha de registro es obligatoria"),
  TipoRegistro: z.string().min(1, "El tipo de registro es obligatorio"),
  Estado: z.string().min(1, "El estado es obligatorio"),
  Descripcion: z.string().min(1, "La descripción es obligatoria"),
  Monto: z.number().min(0, "El monto no puede ser negativo"),
});
