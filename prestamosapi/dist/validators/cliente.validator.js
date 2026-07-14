"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteSchema = void 0;
// src/schemas/cliente.schema.ts
const zod_1 = require("zod");
exports.clienteSchema = zod_1.z.object({
    Nombre: zod_1.z.string().min(1, "El nombre es obligatorio"),
    Cedula: zod_1.z.string().min(5, "La cédula es obligatoria"),
    Telefono: zod_1.z.string().optional(),
    Email: zod_1.z.string().email("Email inválido").optional(),
    Direccion: zod_1.z.string().optional(),
    FechaRegistro: zod_1.z.string().optional(), // Puede ser generada automáticamente
});
