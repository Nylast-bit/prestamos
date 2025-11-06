"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagoAutomaticoSchema = exports.pagoSchema = void 0;
// src/validators/pago.validator.ts
const zod_1 = require("zod");
// Schema original (para pagos manuales)
exports.pagoSchema = zod_1.z.object({
    IdPrestamo: zod_1.z.number("El Id del préstamo es obligatorio"),
    FechaPago: zod_1.z.string("La fecha de pago es obligatoria"),
    TipoPago: zod_1.z.string("El tipo de pago es obligatorio"),
    MontoPagado: zod_1.z.number("El monto pagado es obligatorio"),
    MontoInteresPagado: zod_1.z.number("El monto de interés pagado es obligatorio"),
    MontoCapitalAbonado: zod_1.z.number("El monto capital abonado es obligatorio"),
    CuotasRestantes: zod_1.z.number("Las cuotas restantes son obligatorias"),
    Observaciones: zod_1.z.string().optional(),
});
// Schema para pagos automáticos (nuevo)
exports.pagoAutomaticoSchema = zod_1.z.object({
    IdPrestamo: zod_1.z.number("El Id del préstamo es obligatorio"),
    TipoPago: zod_1.z.string("El tipo de pago es obligatorio"),
    Observaciones: zod_1.z.string().optional().nullable(),
});
