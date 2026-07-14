"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registroConsolidacionSchema = void 0;
// src/validators/registroConsolidacion.validator.ts
const zod_1 = require("zod");
exports.registroConsolidacionSchema = zod_1.z.object({
    IdConsolidacion: zod_1.z.number().optional(),
    FechaRegistro: zod_1.z.string().optional(),
    TipoRegistro: zod_1.z.string().min(1, "El tipo de registro es obligatorio"),
    Estado: zod_1.z.string().min(1, "El estado es obligatorio"),
    Descripcion: zod_1.z.string().min(1, "La descripción es obligatoria"),
    Monto: zod_1.z.number().min(0, "El monto no puede ser negativo"),
});
