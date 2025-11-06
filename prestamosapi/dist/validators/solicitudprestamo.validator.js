"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solicitudPrestamoSchema = void 0;
// src/validators/solicitudPrestamo.validator.ts
const zod_1 = require("zod");
exports.solicitudPrestamoSchema = zod_1.z.object({
    IdCliente: zod_1.z.number().min(1, "El cliente es obligatorio"),
    MontoSolicitado: zod_1.z.number().min(1, "El monto solicitado debe ser mayor a 0"),
    FechaDeseada: zod_1.z.string().min(1, "La fecha deseada es obligatoria"),
    Estado: zod_1.z.string().min(1, "El estado es obligatorio"),
    Notas: zod_1.z.string().optional(),
    FechaCreacion: zod_1.z.string().min(1, "La fecha de creación es obligatoria"),
});
