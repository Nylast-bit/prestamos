// src/utils/consolidacionHelper.ts
export function getRangoConsolidacion(fecha: Date) {
  const year = fecha.getFullYear();
  const month = fecha.getMonth();
  const day = fecha.getDate();

  let inicio: Date | null = null;
  let fin: Date | null = null;

  if (day === 8) {
    // Rango 8 → 22
    inicio = new Date(year, month, 8, 0, 0, 0);
    fin = new Date(year, month, 22, 23, 59, 59);
  } else if (day === 23) {
    // Rango 23 → 7 (del siguiente mes)
    inicio = new Date(year, month, 23, 0, 0, 0);
    fin = new Date(year, month + 1, 7, 23, 59, 59);
  }

  return { inicio, fin };
}
