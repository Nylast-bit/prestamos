import {
  generarFechasVencimiento,
  siguienteFechaPago,
  normalizarDiasPago,
  obtenerFechasVencimiento,
  asignarFechasVencimiento,
  inferirDiasPago,
} from '../../../src/utils/fechasPago';

describe('fechasPago', () => {
  it('quincenal con días acordados 13 y 27 (caso Angelica)', () => {
    const fechas = generarFechasVencimiento({ fechaInicio: '2026-11-05', cantidad: 4, modalidad: 'quincenal', dias: { dia1: 13, dia2: 27 } });
    expect(fechas).toEqual(['2026-11-13', '2026-11-27', '2026-12-13', '2026-12-27']);
  });

  it('quincenal por defecto no vence a los 3 días del inicio (caso préstamo creado el 12)', () => {
    const fechas = generarFechasVencimiento({ fechaInicio: '2026-11-12', cantidad: 3, modalidad: 'quincenal' });
    expect(fechas).toEqual(['2026-11-30', '2026-12-15', '2026-12-30']);
  });

  it('quincenal día 30 se ajusta en febrero', () => {
    const fechas = generarFechasVencimiento({ fechaInicio: '2027-02-01', cantidad: 3, modalidad: 'quincenal', dias: { dia1: 15, dia2: 30 } });
    expect(fechas).toEqual(['2027-02-15', '2027-02-28', '2027-03-15']);
  });

  it('respeta un primer pago elegido a mano', () => {
    const fechas = generarFechasVencimiento({ fechaInicio: '2026-11-12', cantidad: 2, modalidad: 'quincenal', dias: { dia1: 13, dia2: 27 }, primerPago: '2026-11-13' });
    expect(fechas).toEqual(['2026-11-13', '2026-11-27']);
  });

  it('semanal en el día de la semana elegido (viernes = 5)', () => {
    // 2026-11-02 es lunes
    const fechas = generarFechasVencimiento({ fechaInicio: '2026-11-02', cantidad: 3, modalidad: 'semanal', dias: { dia1: 5 } });
    expect(fechas).toEqual(['2026-11-06', '2026-11-13', '2026-11-20']);
  });

  it('semanal por defecto cae el mismo día de la semana del inicio', () => {
    const fechas = generarFechasVencimiento({ fechaInicio: '2026-11-02', cantidad: 2, modalidad: 'semanal' });
    expect(fechas).toEqual(['2026-11-09', '2026-11-16']);
  });

  it('mensual en el día elegido y ajustado a meses cortos', () => {
    const fechas = generarFechasVencimiento({ fechaInicio: '2026-12-20', cantidad: 3, modalidad: 'mensual', dias: { dia1: 31 } });
    expect(fechas).toEqual(['2027-01-31', '2027-02-28', '2027-03-31']);
  });

  it('diario', () => {
    expect(generarFechasVencimiento({ fechaInicio: '2026-11-30', cantidad: 2, modalidad: 'diario' })).toEqual(['2026-12-01', '2026-12-02']);
  });

  it('normaliza días quincenales desordenados o repetidos', () => {
    expect(normalizarDiasPago('quincenal', '2026-11-01', { dia1: 27, dia2: 13 })).toEqual({ dia1: 13, dia2: 27 });
    expect(normalizarDiasPago('quincenal', '2026-11-01', { dia1: 10, dia2: 10 })).toEqual({ dia1: 10, dia2: 25 });
  });

  it('siguiente fecha es estrictamente posterior', () => {
    expect(siguienteFechaPago('2026-11-13', 'quincenal', { dia1: 13, dia2: 27 }).getDate()).toBe(27);
    expect(siguienteFechaPago('2026-11-27', 'quincenal', { dia1: 13, dia2: 27 }).getMonth()).toBe(11);
  });

  it('obtenerFechasVencimiento usa la guardada y omite abonos extraordinarios', () => {
    const tabla = [
      { numeroCuota: 1, pagado: true, fechaVencimiento: '2026-11-13' },
      { numeroCuota: 2, tipo: 'extraordinario', pagado: true },
      { numeroCuota: 3, pagado: false, fechaVencimiento: '2026-11-27' },
    ];
    expect(obtenerFechasVencimiento({ FechaInicio: '2026-11-05', ModalidadPago: 'quincenal' }, tabla)).toEqual(['2026-11-13', null, '2026-11-27']);
  });

  it('asignar solo pendientes desde un próximo pago, sin tocar las pagadas', () => {
    const tabla: any[] = [
      { numeroCuota: 1, pagado: true, fechaVencimiento: '2026-11-15' },
      { numeroCuota: 2, pagado: false, fechaVencimiento: '2026-11-30' },
      { numeroCuota: 3, pagado: false, fechaVencimiento: '2026-12-15' },
    ];
    const ultima = asignarFechasVencimiento(tabla, {
      fechaInicio: '2026-11-01', modalidad: 'quincenal', dias: { dia1: 13, dia2: 27 },
      primerPago: '2026-11-27', soloPendientes: true, sobrescribir: true,
    });
    expect(tabla.map((c) => c.fechaVencimiento)).toEqual(['2026-11-15', '2026-11-27', '2026-12-13']);
    expect(ultima).toBe('2026-12-13');
  });

  it('una cuota agregada al final (arrastre) sigue el patrón de días', () => {
    const tabla: any[] = [
      { numeroCuota: 1, fechaVencimiento: '2026-11-13' },
      { numeroCuota: 2, fechaVencimiento: '2026-11-27' },
      { numeroCuota: 3 },
    ];
    const dias = inferirDiasPago(tabla, 'quincenal', '2026-11-01');
    asignarFechasVencimiento(tabla, { fechaInicio: '2026-11-01', modalidad: 'quincenal', dias });
    expect(tabla[2].fechaVencimiento).toBe('2026-12-13');
  });
});
