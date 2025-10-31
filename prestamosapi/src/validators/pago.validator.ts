// src/validators/pago.validator.ts
import { z } from "zod";

// Schema original (para pagos manuales)
export const pagoSchema = z.object({
  IdPrestamo: z.number("El Id del préstamo es obligatorio"),
  FechaPago: z.string("La fecha de pago es obligatoria"),
  TipoPago: z.string("El tipo de pago es obligatorio"),
  MontoPagado: z.number("El monto pagado es obligatorio"),
  MontoInteresPagado: z.number("El monto de interés pagado es obligatorio"),
  MontoCapitalAbonado: z.number("El monto capital abonado es obligatorio"),
  CuotasRestantes: z.number("Las cuotas restantes son obligatorias"),
  Observaciones: z.string().optional(),
});

// Schema para pagos automáticos (nuevo)
export const pagoAutomaticoSchema = z.object({
  IdPrestamo: z.number("El Id del préstamo es obligatorio"),
  TipoPago: z.string("El tipo de pago es obligatorio"),
  Observaciones: z.string().optional().nullable(),
});