import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";


// Asegúrate de importar el servicio de consolidación desde la ruta correcta
import { createRegistroConsolidacionService } from "./registroconsolidacion.service";
import { actualizarScoreService } from "./score.service";
import { obtenerFechasVencimiento, parseFecha } from "../utils/fechasPago";


export const createPagoService = async (data: any, idEmpresa: number) => {
  const {
    IdPrestamo,
    MontoPagado,
    TipoPago,
    Observaciones,
    MontoInteresPagado,
    MontoCapitalAbonado,
    NumeroCuota
  } = data;

  const totalDistribuido = Number(MontoCapitalAbonado || 0) + Number(MontoInteresPagado || 0);
  if (Math.abs(totalDistribuido - Number(MontoPagado)) > 0.01) {
    throw new Error(`La distribución del pago es incorrecta. Capital (${MontoCapitalAbonado}) + Interés (${MontoInteresPagado}) debe ser igual al monto pagado (${MontoPagado}).`);
  }

  logger.info("--- INICIANDO SERVICIO DE PAGO ---");

  // 1. OBTENER INFO DEL PRÉSTAMO Y VALIDAR EMPRESA
  const { data: prestamo, error: errorPrestamo } = await supabase
    .from("Prestamo")
    .select("*")
    .eq("IdPrestamo", IdPrestamo)
    .eq("IdEmpresa", idEmpresa)
    .single();

  if (errorPrestamo || !prestamo) {
    throw new Error(`Préstamo no encontrado (ID: ${IdPrestamo})`);
  }

  // 2. 🔍 OBTENER NOMBRE DEL CLIENTE REAL (CORREGIDO)
  let nombreCliente = "Cliente Desconocido";

  if (prestamo.IdCliente) {
    // SOLO PEDIMOS "Nombre", porque "Apellido" NO EXISTE en tu tabla
    const { data: clienteData, error: errorCliente } = await supabase
      .from("Cliente")
      .select("Nombre")
      .eq("IdCliente", prestamo.IdCliente)
      .single();

    if (errorCliente) {
      logger.error("⚠️ Error buscando cliente:", errorCliente.message);
    }

    if (clienteData) {
      // Asignamos directamente el nombre
      nombreCliente = clienteData.Nombre || "Sin Nombre";
    }
  }

  logger.info(`👤 Cliente identificado: ${nombreCliente}`);

  // 3. CÁLCULOS LÓGICOS Y ACTUALIZACIÓN DE TABLA DE PAGOS
  const cuotasPrevias = prestamo.CuotasRestantes;
  const nuevasCuotas = cuotasPrevias - 1;
  let cuotasParaGuardar = nuevasCuotas < 0 ? 0 : nuevasCuotas;
  const numeroCuotaReal = NumeroCuota || ((prestamo.CantidadCuotas - cuotasPrevias) + 1);

  const nowISO = new Date().toISOString();
  let tablaPagosString = prestamo.TablaPagos;

  if (tablaPagosString) {
    try {
      const tabla = JSON.parse(tablaPagosString);
      let cuotaIndex = tabla.findIndex((c: any) => c.numeroCuota === numeroCuotaReal || (!c.pagado && c.numeroCuota !== undefined));
      if (cuotaIndex === -1) cuotaIndex = tabla.findIndex((c: any) => !c.pagado);
      if (cuotaIndex !== -1) {
        tabla[cuotaIndex].pagado = true;
        tabla[cuotaIndex].fechaPago = nowISO;
        tabla[cuotaIndex].montoEsperado = tabla[cuotaIndex].cuota;
        tabla[cuotaIndex].montoPagado = Number(MontoPagado);
      }
      tablaPagosString = JSON.stringify(tabla);
      const pendientes = tabla.filter((c: any) => !c.pagado).length;
      cuotasParaGuardar = pendientes;
    } catch (e) {
      logger.error("Error parseando TablaPagos en createPagoService:", e);
    }
  }

  const nuevoCapitalRestante = Math.max(0, (prestamo.CapitalRestante !== undefined && prestamo.CapitalRestante !== null ? prestamo.CapitalRestante : prestamo.MontoPrestado) - Number(MontoCapitalAbonado || 0));

  const esSoloInteres = (prestamo.TipoCalculo || '').toLowerCase().includes('solo_interes') || (prestamo.TipoCalculo || '').toLowerCase().includes('solo');

  let nuevoEstado = prestamo.Estado;
  if (esSoloInteres) {
    if (nuevoCapitalRestante === 0) {
      nuevoEstado = 'Pagado';
    } else {
      nuevoEstado = 'Activo';
    }
  } else {
    if (cuotasParaGuardar === 0 || nuevoCapitalRestante === 0) {
      nuevoEstado = 'Pagado';
    }
  }

  // 3.5 Calcular NumeroEmpresa secuencial para el Pago
  const { data: maxPago } = await supabase
    .from("Pago")
    .select("NumeroEmpresa, Prestamo!inner(IdEmpresa)")
    .eq("Prestamo.IdEmpresa", idEmpresa)
    .order("NumeroEmpresa", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumeroEmpresa = ((maxPago?.NumeroEmpresa) || 0) + 1;

  // 4. INSERTAR EL PAGO
  const { data: pagoRegistrado, error: errorPago } = await supabase
    .from("Pago")
    .insert([{
      IdPrestamo,
      NumeroEmpresa: nextNumeroEmpresa,
      MontoPagado,
      TipoPago,
      Observaciones,
      FechaPago: nowISO,
      NumeroCuota: numeroCuotaReal,
      MontoInteresPagado,
      MontoCapitalAbonado,
      CuotasRestantes: cuotasParaGuardar
    }])
    .select()
    .single();

  if (errorPago) throw new Error("Error DB Pago: " + errorPago.message);

  // 5. ACTUALIZAR EL PRÉSTAMO
  const updatePayload: any = {
    CuotasRestantes: cuotasParaGuardar,
    CapitalRestante: nuevoCapitalRestante,
    Estado: nuevoEstado,
    FechaUltimoPago: nowISO
  };

  if (tablaPagosString) {
    updatePayload.TablaPagos = tablaPagosString;
  }

  const { error: errorUpdate } = await supabase
    .from("Prestamo")
    .update(updatePayload)
    .eq("IdPrestamo", IdPrestamo);

  if (errorUpdate) throw new Error("Error update préstamo: " + errorUpdate.message);

  // 6. REGISTRO EN CONSOLIDACIÓN
  try {
    await createRegistroConsolidacionService({
      IdPago: pagoRegistrado.IdPago,
      Monto: Number(MontoPagado),
      TipoRegistro: "Ingreso",
      Estado: "Pendiente",
      Descripcion: `Pago #${numeroCuotaReal} - Préstamo #${prestamo.NumeroEmpresa ?? prestamo.IdPrestamo} - ${nombreCliente} - Ordinario`,
      FechaRegistro: new Date()
    }, idEmpresa);
    logger.info("✅ Registro de consolidación creado exitosamente.");
  } catch (errorConsolidacion: any) {
    logger.error("⚠️ Alerta consolidación:", errorConsolidacion.message);
  }

  // 7. INTEGRACIÓN CON SISTEMA DE SCORE
  if (prestamo.IdCliente) {
    try {
      let fechaVenc: Date | null = null;
      if (tablaPagosString) {
        const tabla = JSON.parse(tablaPagosString);
        // Buscar la cuota recién pagada y su vencimiento según los días de pago acordados
        let idxPagada = tabla.findIndex((c: any) => c.numeroCuota === numeroCuotaReal);
        if (idxPagada === -1) idxPagada = tabla.findIndex((c: any) => c.fechaPago === nowISO);
        const fechasVencimiento = obtenerFechasVencimiento(prestamo, tabla);
        if (idxPagada !== -1 && fechasVencimiento[idxPagada]) fechaVenc = parseFecha(fechasVencimiento[idxPagada] as string);
      }

      let puntajeCambio = 0;
      let motivo = '';
      
      if (fechaVenc) {
        const hoy = new Date();
        fechaVenc.setUTCHours(0,0,0,0);
        hoy.setUTCHours(0,0,0,0);
        
        const diffTime = hoy.getTime() - fechaVenc.getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        
        if (diffDays <= 0) {
          puntajeCambio = diffDays < 0 ? 20 : 15;
          motivo = diffDays < 0 ? 'Pago anticipado' : 'Pago a tiempo';
        }
      }

      if (puntajeCambio > 0) {
        await actualizarScoreService(prestamo.IdCliente.toString(), idEmpresa, puntajeCambio, motivo, `Pago cuota #${numeroCuotaReal}`, prestamo.IdPrestamo);
        
        const { data: cliente } = await supabase.from('Cliente').select('TotalCuotasATiempo').eq('IdCliente', prestamo.IdCliente).single();
        if (cliente) {
          await supabase.from('Cliente').update({
            TotalCuotasATiempo: (cliente.TotalCuotasATiempo || 0) + 1
          }).eq('IdCliente', prestamo.IdCliente);
        }
      }

      if (nuevoEstado === 'Pagado') {
        const moraAcumulada = prestamo.MontoMoraAcumulado || 0;
        
        const { data: cliente } = await supabase.from('Cliente').select('TotalPrestamosCompletados, RachaPositiva').eq('IdCliente', prestamo.IdCliente).single();
        
        if (moraAcumulada === 0) {
          await actualizarScoreService(prestamo.IdCliente.toString(), idEmpresa, 50, 'Préstamo sin mora', 'Préstamo completado sin atrasos', prestamo.IdPrestamo);
          
          if (cliente) {
            let nuevaRacha = (cliente.RachaPositiva || 0) + 1;
            
            if (nuevaRacha >= 3) {
              await actualizarScoreService(prestamo.IdCliente.toString(), idEmpresa, 100, 'Racha positiva', 'Completó 3 o más préstamos consecutivos sin mora', prestamo.IdPrestamo);
              nuevaRacha = 0;
            }
            
            await supabase.from('Cliente').update({
              TotalPrestamosCompletados: (cliente.TotalPrestamosCompletados || 0) + 1,
              RachaPositiva: nuevaRacha
            }).eq('IdCliente', prestamo.IdCliente);
          }
        } else {
          if (cliente) {
            await supabase.from('Cliente').update({
              TotalPrestamosCompletados: (cliente.TotalPrestamosCompletados || 0) + 1,
              RachaPositiva: 0
            }).eq('IdCliente', prestamo.IdCliente);
          }
        }
      }
    } catch (errorScore: any) {
      logger.error("⚠️ Error en sistema de score:", errorScore.message);
    }
  }

  return { pago: pagoRegistrado, nuevoEstado };
};

// 1. Obtener todos los pagos
export const getAllPagosService = async (idEmpresa: number) => {
  const { data, error } = await supabase
    .from("Pago")
    .select(`
      *,
      Prestamo!inner (
        IdPrestamo,
        IdEmpresa,
        FechaInicio,
        FechaFinEstimada,
        CapitalRestante,
        CantidadCuotas,
        MontoCuota,
        TipoCalculo,
        InteresPorcentaje,
        TablaPagos,
        Cliente (
          Nombre
        )
      )
    `)
    .eq("Prestamo.IdEmpresa", idEmpresa)
    .order("FechaPago", { ascending: false });

  if (error) {
    throw new Error(`Error al obtener el historial de pagos: ${error.message}`);
  }

  return agregarSaldoPendiente(data || []);
};

/**
 * Calcula para cada pago el saldo que el préstamo debía JUSTO DESPUÉS de ese pago
 * (lo que muestra el volante como "Monto Pendiente").
 *
 * saldo después del pago P = lo pendiente hoy en TablaPagos + lo pagado después de P.
 * Así respeta arrastres, abonos extraordinarios y cuotas agregadas, en vez de
 * asumir MontoCuota × CuotasRestantes. Recibe pagos con Prestamo.TablaPagos y lo
 * quita de la respuesta para no inflar el payload.
 */
export const agregarSaldoPendiente = (pagos: any[]) => {
  const pagosPorPrestamo = new Map<number, any[]>();
  for (const p of pagos) {
    const lista = pagosPorPrestamo.get(p.IdPrestamo) || [];
    lista.push(p);
    pagosPorPrestamo.set(p.IdPrestamo, lista);
  }

  const redondear = (n: number) => Math.round(n * 100) / 100;

  for (const lista of pagosPorPrestamo.values()) {
    const prestamo = lista[0].Prestamo || {};
    const tipoCalculo = (prestamo.TipoCalculo || '').toLowerCase();
    const esSoloInteres = tipoCalculo.includes('solo');

    let tabla: any[] = [];
    try {
      tabla = typeof prestamo.TablaPagos === 'string' ? JSON.parse(prestamo.TablaPagos || '[]') : (prestamo.TablaPagos || []);
    } catch (e) {
      tabla = [];
    }

    // Las cuotas saldadas por reenganche no tienen un Pago real: cuentan como pendientes antes del reenganche
    const pendienteHoy = tabla
      .filter((c: any) => !c.pagado || String(c.observacion || '').startsWith('Saldado por Reenganche'))
      .reduce((sum: number, c: any) => sum + Number(c.cuota || 0), 0);
    const capitalHoy = Number(prestamo.CapitalRestante || 0);
    const tasa = Number(prestamo.InteresPorcentaje || 0) / 100;

    // Del más reciente al más antiguo, acumulando lo pagado después de cada pago
    const ordenados = [...lista].sort((a, b) =>
      new Date(b.FechaPago).getTime() - new Date(a.FechaPago).getTime() || b.IdPago - a.IdPago
    );
    let pagadoDespues = 0;
    let capitalDespues = 0;
    for (const p of ordenados) {
      p.SaldoPendiente = esSoloInteres
        ? redondear((capitalHoy + capitalDespues) * (1 + tasa))
        : redondear(pendienteHoy + pagadoDespues);
      pagadoDespues += Number(p.MontoPagado || 0);
      capitalDespues += Number(p.MontoCapitalAbonado || 0);
    }
  }

  for (const p of pagos) {
    if (p.Prestamo) delete p.Prestamo.TablaPagos;
  }
  return pagos;
};
// 2. Obtener un pago por ID
export const getPagoByIdService = async (id: number, idEmpresa: number) => {
  const { data, error } = await supabase
    .from("Pago")
    .select(`
      *,
      Prestamo!inner(*)
    `)
    .eq("IdPago", id)
    .eq("Prestamo.IdEmpresa", idEmpresa)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// 3. Calcular Próxima Cuota (Solo lectura)
export const getProximaCuotaService = async (idPrestamo: number, idEmpresa: number) => {
  const { data: prestamo, error } = await supabase
    .from("Prestamo")
    .select("*")
    .eq("IdPrestamo", idPrestamo)
    .eq("IdEmpresa", idEmpresa)
    .single();

  if (error) throw new Error(error.message);

  const cuotaNumero = (prestamo.CantidadCuotas - prestamo.CuotasRestantes) + 1;

  // Aquí podrías leer la TablaPagos JSON si quieres exactitud, 
  // o devolver la cuota fija si es nivelada.
  return {
    IdPrestamo: idPrestamo,
    ProximaCuotaNumero: cuotaNumero,
    MontoCuota: prestamo.MontoCuota,
    FechaProximoPago: "Calculado en frontend" // O usa tu lógica de fechas aquí
  };
};

// 4. Eliminar Pago (Cuidado: esto debería revertir saldo, por ahora solo borra)
export const deletePagoService = async (idPago: number, idEmpresa: number) => {
  logger.info(`--- INICIANDO REVERSIÓN DEL PAGO #${idPago} ---`);

  // Validar seguridad obteniéndolo primero
  await getPagoByIdService(idPago, idEmpresa);

  // 1. OBTENER DATOS DEL PAGO ANTES DE BORRARLO
  const { data: pago, error: errorPago } = await supabase
    .from("Pago")
    .select("IdPrestamo, MontoPagado, MontoCapitalAbonado, NumeroCuota")
    .eq("IdPago", idPago)
    .single();

  if (errorPago || !pago) {
    throw new Error("No se encontró el pago original para revertir.");
  }

  // 2. OBTENER EL PRÉSTAMO ACTUAL
  const { data: prestamo, error: errorPrestamo } = await supabase
    .from("Prestamo")
    .select("CuotasRestantes, Estado, CapitalRestante, MontoPrestado, TablaPagos")
    .eq("IdPrestamo", pago.IdPrestamo)
    .single();

  if (errorPrestamo || !prestamo) {
    throw new Error("No se encontró el préstamo asociado a este pago.");
  }

  // 3. CÁLCULO DE REVERSIÓN
  // Le devolvemos la cuota que había pagado
  const nuevasCuotas = prestamo.CuotasRestantes + 1;
  // Si estaba "Pagado", lo revivimos a "Activo"
  const nuevoEstado = prestamo.Estado === 'Pagado' ? 'Activo' : prestamo.Estado;

  // Restaurar CapitalRestante
  let nuevoCapitalRestante = (prestamo.CapitalRestante !== undefined && prestamo.CapitalRestante !== null ? prestamo.CapitalRestante : prestamo.MontoPrestado) + Number(pago.MontoCapitalAbonado || 0);
  if (nuevoCapitalRestante > prestamo.MontoPrestado) nuevoCapitalRestante = prestamo.MontoPrestado;

  // Revertir TablaPagos
  let nuevaTablaPagosString = prestamo.TablaPagos;
  if (nuevaTablaPagosString) {
    try {
      const tabla = JSON.parse(nuevaTablaPagosString);
      const cuotaIndex = tabla.findIndex((c: any) => c.numeroCuota === pago.NumeroCuota && c.pagado);
      if (cuotaIndex !== -1) {
        tabla[cuotaIndex].pagado = false;
        delete tabla[cuotaIndex].fechaPago;
        if (tabla[cuotaIndex].montoEsperado !== undefined) tabla[cuotaIndex].cuota = tabla[cuotaIndex].montoEsperado;
        delete tabla[cuotaIndex].montoPagado;
        delete tabla[cuotaIndex].montoEsperado;
      }
      nuevaTablaPagosString = JSON.stringify(tabla);
    } catch (e) {
      logger.error("Error parseando TablaPagos en deletePagoService:", e);
    }
  }

  logger.info(`Revertiendo Préstamo #${pago.IdPrestamo}: Cuotas subirán a ${nuevasCuotas}, Estado será ${nuevoEstado}`);

  // 4. ACTUALIZAR EL PRÉSTAMO
  const updatePayload: any = {
    CuotasRestantes: nuevasCuotas,
    Estado: nuevoEstado,
    CapitalRestante: nuevoCapitalRestante,
  };
  if (nuevaTablaPagosString) {
    updatePayload.TablaPagos = nuevaTablaPagosString;
  }

  const { error: errorUpdate } = await supabase
    .from("Prestamo")
    .update(updatePayload)
    .eq("IdPrestamo", pago.IdPrestamo);

  if (errorUpdate) {
    throw new Error("Error restaurando las cuotas del préstamo: " + errorUpdate.message);
  }

  // 5. BORRAR EL PAGO (🔥 El ON DELETE CASCADE borrará la consolidación automáticamente)
  const { error: errorDelete } = await supabase
    .from("Pago")
    .delete()
    .eq("IdPago", idPago);

  if (errorDelete) {
    // En caso raro de fallo, habría que revisar a mano, pero con Supabase es casi atómico.
    throw new Error("Error al eliminar el registro del pago: " + errorDelete.message);
  }

  logger.info("--- REVERSIÓN COMPLETADA CON ÉXITO ---");
  return true;
};

// 5. Actualizar Pago (Básico - Solo observaciones o tipo)
export const updatePagoService = async (id: number, idEmpresa: number, data: any) => {
  // Validar pertenencia
  await getPagoByIdService(id, idEmpresa);

  const { data: pago, error } = await supabase
    .from("Pago")
    .update(data)
    .eq("IdPago", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return pago;
};

export const getHistorialPagosService = async (idPrestamo: number, idEmpresa: number) => {
  // Validar que el prestamo me pertenezca
  const { data: prestamo } = await supabase.from('Prestamo').select('IdPrestamo').eq('IdPrestamo', idPrestamo).eq('IdEmpresa', idEmpresa).single();
  if (!prestamo) throw new Error("Préstamo no encontrado");

  const { data, error } = await supabase
    .from("Pago")
    .select("*")
    .eq("IdPrestamo", idPrestamo)
    .order("NumeroCuota", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}
