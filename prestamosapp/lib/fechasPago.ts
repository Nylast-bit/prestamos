// Calendario de pagos de un préstamo.
// La fuente de verdad es `fechaVencimiento` (YYYY-MM-DD) en cada cuota de TablaPagos.
// Los préstamos viejos que no la tienen se calculan con los días por defecto.
// ⚠️ Copia de prestamosapi/src/utils/fechasPago.ts: mantener ambas idénticas

export interface DiasPago {
  // quincenal: dos días del mes (dia1 < dia2) · mensual: día del mes · semanal: día de la semana (0 = domingo)
  dia1?: number | null;
  dia2?: number | null;
}

// Distancia mínima entre el inicio del préstamo y el primer pago (evita vencer a los pocos días)
const MIN_DIAS_PRIMER_PAGO: Record<string, number> = { diario: 1, semanal: 4, quincenal: 7, mensual: 15 };

const DIA_MS = 24 * 60 * 60 * 1000;

const normalizarModalidad = (modalidad?: string | null) => (modalidad || 'mensual').toLowerCase().trim();

// Fecha local a mediodía (evita saltos de día por zona horaria)
export const parseFecha = (valor: string | Date): Date => {
  if (valor instanceof Date) return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate(), 12);
  const [y, m, d] = String(valor).split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

export const toISODate = (fecha: Date): string => {
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
};

const diasEntre = (a: string | Date, b: string | Date) => Math.round((parseFecha(b).getTime() - parseFecha(a).getTime()) / DIA_MS);

// Día del mes ajustado a meses cortos (30 en febrero → 28/29)
const diaEnMes = (year: number, month: number, dia: number) => {
  const ultimo = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(dia, ultimo), 12);
};

export const diasPagoPorDefecto = (modalidad: string, fechaInicio: string | Date): DiasPago => {
  const inicio = parseFecha(fechaInicio);
  switch (normalizarModalidad(modalidad)) {
    case 'quincenal': return { dia1: 15, dia2: 30 };
    case 'mensual': return { dia1: inicio.getDate(), dia2: null };
    case 'semanal': return { dia1: inicio.getDay(), dia2: null };
    default: return { dia1: null, dia2: null };
  }
};

// Completa días faltantes con los valores por defecto y los deja ordenados y en rango
export const normalizarDiasPago = (modalidad: string, fechaInicio: string | Date, dias?: DiasPago | null): DiasPago => {
  const mod = normalizarModalidad(modalidad);
  const def = diasPagoPorDefecto(mod, fechaInicio);
  const n = (v: any) => (v === null || v === undefined || v === '' || isNaN(Number(v)) ? null : Math.trunc(Number(v)));
  let d1 = n(dias?.dia1) ?? def.dia1 ?? null;
  let d2 = n(dias?.dia2) ?? def.dia2 ?? null;

  if (mod === 'quincenal') {
    d1 = Math.min(31, Math.max(1, d1 ?? 15));
    d2 = Math.min(31, Math.max(1, d2 ?? 30));
    if (d1 === d2) d2 = d1 <= 16 ? d1 + 15 : d1 - 15;
    if (d1 > d2) [d1, d2] = [d2, d1];
    return { dia1: d1, dia2: d2 };
  }
  if (mod === 'mensual') return { dia1: Math.min(31, Math.max(1, d1 ?? 1)), dia2: null };
  if (mod === 'semanal') return { dia1: ((d1 ?? 0) % 7 + 7) % 7, dia2: null };
  return { dia1: null, dia2: null };
};

// Primera fecha de pago estrictamente posterior a `desde`
export const siguienteFechaPago = (desde: string | Date, modalidad: string, dias: DiasPago): Date => {
  const base = parseFecha(desde);
  const mod = normalizarModalidad(modalidad);

  if (mod === 'diario') return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1, 12);

  if (mod === 'semanal') {
    const objetivo = Number(dias.dia1 ?? base.getDay());
    const salto = ((objetivo - base.getDay() + 7) % 7) || 7;
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + salto, 12);
  }

  const diasMes = mod === 'quincenal' ? [Number(dias.dia1 ?? 15), Number(dias.dia2 ?? 30)] : [Number(dias.dia1 ?? base.getDate())];
  for (let offset = 0; offset < 3; offset++) {
    for (const dia of diasMes) {
      const candidato = diaEnMes(base.getFullYear(), base.getMonth() + offset, dia);
      if (candidato.getTime() > base.getTime()) return candidato;
    }
  }
  return diaEnMes(base.getFullYear(), base.getMonth() + 1, diasMes[0]);
};

// Primera fecha válida respetando la distancia mínima desde el inicio
export const primeraFechaPago = (fechaInicio: string | Date, modalidad: string, dias: DiasPago): Date => {
  const mod = normalizarModalidad(modalidad);
  const minimo = MIN_DIAS_PRIMER_PAGO[mod] ?? 1;
  let fecha = siguienteFechaPago(fechaInicio, mod, dias);
  while (diasEntre(fechaInicio, fecha) < minimo) fecha = siguienteFechaPago(fecha, mod, dias);
  return fecha;
};

// Genera `cantidad` fechas de vencimiento (YYYY-MM-DD)
export const generarFechasVencimiento = (params: {
  fechaInicio: string | Date;
  cantidad: number;
  modalidad: string;
  dias?: DiasPago | null;
  primerPago?: string | Date | null;
}): string[] => {
  const { fechaInicio, cantidad, modalidad, primerPago } = params;
  const dias = normalizarDiasPago(modalidad, fechaInicio, params.dias);
  const fechas: string[] = [];
  let fecha = primerPago ? parseFecha(primerPago) : primeraFechaPago(fechaInicio, modalidad, dias);
  for (let i = 0; i < Math.max(0, cantidad); i++) {
    fechas.push(toISODate(fecha));
    fecha = siguienteFechaPago(fecha, modalidad, dias);
  }
  return fechas;
};

// Abonos extraordinarios y liquidaciones son filas de la tabla, pero no cuotas con vencimiento
export const esCuotaProgramada = (cuota: any) => cuota?.tipo !== 'extraordinario' && cuota?.tipo !== 'liquidar';

// Deduce los días de pago a partir de las fechas ya guardadas en la tabla
export const inferirDiasPago = (tabla: any[], modalidad: string, fechaInicio: string | Date): DiasPago => {
  const mod = normalizarModalidad(modalidad);
  const fechas = tabla.filter((c) => esCuotaProgramada(c) && c.fechaVencimiento).map((c) => parseFecha(c.fechaVencimiento));
  if (fechas.length === 0) return normalizarDiasPago(mod, fechaInicio, null);
  const ultima = fechas[fechas.length - 1];
  if (mod === 'semanal') return { dia1: ultima.getDay(), dia2: null };
  if (mod === 'mensual') return { dia1: ultima.getDate(), dia2: null };
  if (mod === 'quincenal' && fechas.length >= 2) {
    return normalizarDiasPago(mod, fechaInicio, { dia1: fechas[fechas.length - 2].getDate(), dia2: ultima.getDate() });
  }
  return normalizarDiasPago(mod, fechaInicio, null);
};

/**
 * Fecha de vencimiento de cada fila de la tabla (null para abonos/liquidaciones).
 * Usa `fechaVencimiento` guardada; si falta (préstamos viejos), la calcula con los días por defecto.
 */
export const obtenerFechasVencimiento = (prestamo: { FechaInicio?: string | null; ModalidadPago?: string | null }, tabla: any[]): (string | null)[] => {
  const programadas = tabla.filter(esCuotaProgramada);
  const calculadas = prestamo?.FechaInicio
    ? generarFechasVencimiento({ fechaInicio: prestamo.FechaInicio, cantidad: programadas.length, modalidad: prestamo.ModalidadPago || 'mensual' })
    : [];
  let i = 0;
  return tabla.map((c) => {
    if (!esCuotaProgramada(c)) return null;
    const calculada = calculadas[i++] ?? null;
    return c.fechaVencimiento || calculada;
  });
};

/**
 * Asigna `fechaVencimiento` a las cuotas programadas que no la tengan (o a todas con `sobrescribir`),
 * empezando en `primerPago` o en la siguiente fecha según los días de pago. No toca filas pagadas
 * cuando `soloPendientes` es true. Devuelve la última fecha asignada.
 */
export const asignarFechasVencimiento = (
  tabla: any[],
  params: { fechaInicio: string | Date; modalidad: string; dias?: DiasPago | null; primerPago?: string | Date | null; soloPendientes?: boolean; sobrescribir?: boolean }
): string | null => {
  const { fechaInicio, modalidad, primerPago, soloPendientes, sobrescribir } = params;
  const dias = normalizarDiasPago(modalidad, fechaInicio, params.dias);
  let fecha: Date | null = primerPago ? parseFecha(primerPago) : null;
  let ultima: string | null = null;

  for (const cuota of tabla) {
    if (!esCuotaProgramada(cuota)) continue;
    const omitir = (soloPendientes && cuota.pagado) || (!sobrescribir && cuota.fechaVencimiento);
    if (omitir) {
      if (cuota.fechaVencimiento) ultima = cuota.fechaVencimiento;
      continue;
    }
    if (!fecha) {
      fecha = ultima ? siguienteFechaPago(ultima, modalidad, dias) : primeraFechaPago(fechaInicio, modalidad, dias);
    }
    cuota.fechaVencimiento = toISODate(fecha);
    ultima = cuota.fechaVencimiento;
    fecha = siguienteFechaPago(fecha, modalidad, dias);
  }
  return ultima;
};

// --- Solo frontend ---------------------------------------------------------

// Primera cuota pendiente de un préstamo con su vencimiento y monto (para radar, cards y detalle)
export const proximaCuotaPendiente = (prestamo: any): { fecha: Date; fechaISO: string; monto: number | null; numeroCuota: number | null } | null => {
  if (!prestamo) return null;
  let tabla: any[] = [];
  try { tabla = typeof prestamo.TablaPagos === 'string' ? JSON.parse(prestamo.TablaPagos || '[]') : (prestamo.TablaPagos || []); } catch (e) { tabla = []; }
  const fechas = obtenerFechasVencimiento(prestamo, tabla);
  const idx = tabla.findIndex((c) => esCuotaProgramada(c) && !c.pagado);
  if (idx === -1 || !fechas[idx]) return null;
  return {
    fecha: parseFecha(fechas[idx] as string),
    fechaISO: fechas[idx] as string,
    monto: tabla[idx]?.cuota !== undefined ? Number(tabla[idx].cuota) : null,
    numeroCuota: tabla[idx]?.numeroCuota ?? null,
  };
};

const NOMBRES_DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Texto corto de los días de pago: "Días 13 y 27", "Día 5 de cada mes", "Cada viernes"
export const describirDiasPago = (modalidad: string, dias: DiasPago): string => {
  const mod = normalizarModalidad(modalidad);
  if (mod === 'quincenal') return `Días ${dias.dia1} y ${dias.dia2}`;
  if (mod === 'mensual') return `Día ${dias.dia1} de cada mes`;
  if (mod === 'semanal') return `Cada ${NOMBRES_DIAS[Number(dias.dia1 ?? 0)].toLowerCase()}`;
  return 'Todos los días';
};

export const nombresDiasSemana = NOMBRES_DIAS;
