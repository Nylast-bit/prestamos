"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRangoConsolidacion = getRangoConsolidacion;
// src/utils/consolidacionHelper.ts
function getRangoConsolidacion(fecha) {
    const year = fecha.getFullYear();
    const month = fecha.getMonth();
    const day = fecha.getDate();
    let inicio = null;
    let fin = null;
    if (day === 8) {
        // Rango 8 → 22
        inicio = new Date(year, month, 8, 0, 0, 0);
        fin = new Date(year, month, 22, 23, 59, 59);
    }
    else if (day === 23) {
        // Rango 23 → 7 (del siguiente mes)
        inicio = new Date(year, month, 23, 0, 0, 0);
        fin = new Date(year, month + 1, 7, 23, 59, 59);
    }
    return { inicio, fin };
}
