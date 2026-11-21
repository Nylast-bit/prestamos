"use strict";
// Calendario de pagos de un préstamo.
// La fuente de verdad es `fechaVencimiento` (YYYY-MM-DD) en cada cuota de TablaPagos.
// Los préstamos viejos que no la tienen se calculan con los días por defecto.
// ⚠️ Mantener idéntico a prestamosapp/lib/fechasPago.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.asignarFechasVencimiento = exports.obtenerFechasVencimiento = exports.inferirDiasPago = exports.esCuotaProgramada = exports.generarFechasVencimiento = exports.primeraFechaPago = exports.siguienteFechaPago = exports.normalizarDiasPago = exports.diasPagoPorDefecto = exports.toISODate = exports.parseFecha = void 0;
// Distancia mínima entre el inicio del préstamo y el primer pago (evita vencer a los pocos días)
const MIN_DIAS_PRIMER_PAGO = { diario: 1, semanal: 4, quincenal: 7, mensual: 15 };
const DIA_MS = 24 * 60 * 60 * 1000;
const normalizarModalidad = (modalidad) => (modalidad || 'mensual').toLowerCase().trim();
// Fecha local a mediodía (evita saltos de día por zona horaria)
const parseFecha = (valor) => {
    if (valor instanceof Date)
        return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate(), 12);
    const [y, m, d] = String(valor).split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d, 12);
};
exports.parseFecha = parseFecha;
const toISODate = (fecha) => {
    const mm = String(fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mm}-${dd}`;
};
exports.toISODate = toISODate;
const diasEntre = (a, b) => Math.round(((0, exports.parseFecha)(b).getTime() - (0, exports.parseFecha)(a).getTime()) / DIA_MS);
// Día del mes ajustado a meses cortos (30 en febrero → 28/29)
const diaEnMes = (year, month, dia) => {
    const ultimo = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(dia, ultimo), 12);
};
const diasPagoPorDefecto = (modalidad, fechaInicio) => {
    const inicio = (0, exports.parseFecha)(fechaInicio);
    switch (normalizarModalidad(modalidad)) {
        case 'quincenal': return { dia1: 15, dia2: 30 };
        case 'mensual': return { dia1: inicio.getDate(), dia2: null };
        case 'semanal': return { dia1: inicio.getDay(), dia2: null };
        default: return { dia1: null, dia2: null };
    }
};
exports.diasPagoPorDefecto = diasPagoPorDefecto;
// Completa días faltantes con los valores por defecto y los deja ordenados y en rango
const normalizarDiasPago = (modalidad, fechaInicio, dias) => {
    const mod = normalizarModalidad(modalidad);
    const def = (0, exports.diasPagoPorDefecto)(mod, fechaInicio);
    const n = (v) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Math.trunc(Number(v)));
    let d1 = n(dias?.dia1) ?? def.dia1 ?? null;
    let d2 = n(dias?.dia2) ?? def.dia2 ?? null;
    if (mod === 'quincenal') {
        d1 = Math.min(31, Math.max(1, d1 ?? 15));
        d2 = Math.min(31, Math.max(1, d2 ?? 30));
        if (d1 === d2)
            d2 = d1 <= 16 ? d1 + 15 : d1 - 15;
        if (d1 > d2)
            [d1, d2] = [d2, d1];
        return { dia1: d1, dia2: d2 };
    }
    if (mod === 'mensual')
        return { dia1: Math.min(31, Math.max(1, d1 ?? 1)), dia2: null };
    if (mod === 'semanal')
        return { dia1: ((d1 ?? 0) % 7 + 7) % 7, dia2: null };
    return { dia1: null, dia2: null };
};
exports.normalizarDiasPago = normalizarDiasPago;
// Primera fecha de pago estrictamente posterior a `desde`
const siguienteFechaPago = (desde, modalidad, dias) => {
    const base = (0, exports.parseFecha)(desde);
    const mod = normalizarModalidad(modalidad);
    if (mod === 'diario')
        return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 12);
    if (mod === 'semanal') {
        const objetivo = Number(dias.dia1 ?? base.getDay());
        const salto = ((objetivo - base.getDay() + 7) % 7) || 7;
        return new Date(base.getFullYear(), base.getMonth(), base.getDate() + salto, 12);
    }
    const diasMes = mod === 'quincenal' ? [Number(dias.dia1 ?? 15), Number(dias.dia2 ?? 30)] : [Number(dias.dia1 ?? base.getDate())];
    for (let offset = 0; offset < 3; offset++) {
        for (const dia of diasMes) {
            const candidato = diaEnMes(base.getFullYear(), base.getMonth() + offset, dia);
            if (candidato.getTime() > base.getTime())
                return candidato;
        }
    }
    return diaEnMes(base.getFullYear(), base.getMonth() + 1, diasMes[0]);
};
exports.siguienteFechaPago = siguienteFechaPago;
// Primera fecha válida respetando la distancia mínima desde el inicio
const primeraFechaPago = (fechaInicio, modalidad, dias) => {
    const mod = normalizarModalidad(modalidad);
    const minimo = MIN_DIAS_PRIMER_PAGO[mod] ?? 1;
    let fecha = (0, exports.siguienteFechaPago)(fechaInicio, mod, dias);
    while (diasEntre(fechaInicio, fecha) < minimo)
        fecha = (0, exports.siguienteFechaPago)(fecha, mod, dias);
    return fecha;
};
exports.primeraFechaPago = primeraFechaPago;
// Genera `cantidad` fechas de vencimiento (YYYY-MM-DD)
const generarFechasVencimiento = (params) => {
    const { fechaInicio, cantidad, modalidad, primerPago } = params;
    const dias = (0, exports.normalizarDiasPago)(modalidad, fechaInicio, params.dias);
    const fechas = [];
    let fecha = primerPago ? (0, exports.parseFecha)(primerPago) : (0, exports.primeraFechaPago)(fechaInicio, modalidad, dias);
    for (let i = 0; i < Math.max(0, cantidad); i++) {
        fechas.push((0, exports.toISODate)(fecha));
        fecha = (0, exports.siguienteFechaPago)(fecha, modalidad, dias);
    }
    return fechas;
};
exports.generarFechasVencimiento = generarFechasVencimiento;
// Abonos extraordinarios y liquidaciones son filas de la tabla, pero no cuotas con vencimiento
const esCuotaProgramada = (cuota) => cuota?.tipo !== 'extraordinario' && cuota?.tipo !== 'liquidar';
exports.esCuotaProgramada = esCuotaProgramada;
// Deduce los días de pago a partir de las fechas ya guardadas en la tabla
const inferirDiasPago = (tabla, modalidad, fechaInicio) => {
    const mod = normalizarModalidad(modalidad);
    const fechas = tabla.filter((c) => (0, exports.esCuotaProgramada)(c) && c.fechaVencimiento).map((c) => (0, exports.parseFecha)(c.fechaVencimiento));
    if (fechas.length === 0)
        return (0, exports.normalizarDiasPago)(mod, fechaInicio, null);
    const ultima = fechas[fechas.length - 1];
    if (mod === 'semanal')
        return { dia1: ultima.getDay(), dia2: null };
    if (mod === 'mensual')
        return { dia1: ultima.getDate(), dia2: null };
    if (mod === 'quincenal' && fechas.length >= 2) {
        return (0, exports.normalizarDiasPago)(mod, fechaInicio, { dia1: fechas[fechas.length - 2].getDate(), dia2: ultima.getDate() });
    }
    return (0, exports.normalizarDiasPago)(mod, fechaInicio, null);
};
exports.inferirDiasPago = inferirDiasPago;
/**
 * Fecha de vencimiento de cada fila de la tabla (null para abonos/liquidaciones).
 * Usa `fechaVencimiento` guardada; si falta (préstamos viejos), la calcula con los días por defecto.
 */
const obtenerFechasVencimiento = (prestamo, tabla) => {
    const programadas = tabla.filter(exports.esCuotaProgramada);
    const calculadas = prestamo?.FechaInicio
        ? (0, exports.generarFechasVencimiento)({ fechaInicio: prestamo.FechaInicio, cantidad: programadas.length, modalidad: prestamo.ModalidadPago || 'mensual' })
        : [];
    let i = 0;
    return tabla.map((c) => {
        if (!(0, exports.esCuotaProgramada)(c))
            return null;
        const calculada = calculadas[i++] ?? null;
        return c.fechaVencimiento || calculada;
    });
};
exports.obtenerFechasVencimiento = obtenerFechasVencimiento;
/**
 * Asigna `fechaVencimiento` a las cuotas programadas que no la tengan (o a todas con `sobrescribir`),
 * empezando en `primerPago` o en la siguiente fecha según los días de pago. No toca filas pagadas
 * cuando `soloPendientes` es true. Devuelve la última fecha asignada.
 */
const asignarFechasVencimiento = (tabla, params) => {
    const { fechaInicio, modalidad, primerPago, soloPendientes, sobrescribir } = params;
    const dias = (0, exports.normalizarDiasPago)(modalidad, fechaInicio, params.dias);
    let fecha = primerPago ? (0, exports.parseFecha)(primerPago) : null;
    let ultima = null;
    for (const cuota of tabla) {
        if (!(0, exports.esCuotaProgramada)(cuota))
            continue;
        const omitir = (soloPendientes && cuota.pagado) || (!sobrescribir && cuota.fechaVencimiento);
        if (omitir) {
            if (cuota.fechaVencimiento)
                ultima = cuota.fechaVencimiento;
            continue;
        }
        if (!fecha) {
            fecha = ultima ? (0, exports.siguienteFechaPago)(ultima, modalidad, dias) : (0, exports.primeraFechaPago)(fechaInicio, modalidad, dias);
        }
        cuota.fechaVencimiento = (0, exports.toISODate)(fecha);
        ultima = cuota.fechaVencimiento;
        fecha = (0, exports.siguienteFechaPago)(fecha, modalidad, dias);
    }
    return ultima;
};
exports.asignarFechasVencimiento = asignarFechasVencimiento;
