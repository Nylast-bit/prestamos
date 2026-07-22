import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";


// Asegúrate de importar el servicio de consolidación desde la ruta correcta
import { createRegistroConsolidacionService } from "./registroconsolidacion.service";


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
      const cuotaIndex = tabla.findIndex((c: any) => c.numeroCuota === numeroCuotaReal || (!c.pagado && c.numeroCuota !== undefined));
      if (cuotaIndex !== -1) {
        tabla[cuotaIndex].pagado = true;
        tabla[cuotaIndex].fechaPago = nowISO;
      } else {
        const firstUnpaid = tabla.findIndex((c: any) => !c.pagado);
        if (firstUnpaid !== -1) {
          tabla[firstUnpaid].pagado = true;
          tabla[firstUnpaid].fechaPago = nowISO;
        }
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
      Descripcion: `Pago #${numeroCuotaReal} de ${nombreCliente}`,
      FechaRegistro: new Date()
    }, idEmpresa);
    logger.info("✅ Registro de consolidación creado exitosamente.");
  } catch (errorConsolidacion: any) {
    logger.error("⚠️ Alerta consolidación:", errorConsolidacion.message);
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

  return data;
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
    .select("IdPrestamo, MontoPagado")
    .eq("IdPago", idPago)
    .single();

  if (errorPago || !pago) {
    throw new Error("No se encontró el pago original para revertir.");
  }

  // 2. OBTENER EL PRÉSTAMO ACTUAL
  const { data: prestamo, error: errorPrestamo } = await supabase
    .from("Prestamo")
    .select("CuotasRestantes, Estado")
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

  logger.info(`Revertiendo Préstamo #${pago.IdPrestamo}: Cuotas subirán a ${nuevasCuotas}, Estado será ${nuevoEstado}`);

  // 4. ACTUALIZAR EL PRÉSTAMO
  const { error: errorUpdate } = await supabase
    .from("Prestamo")
    .update({
      CuotasRestantes: nuevasCuotas,
      Estado: nuevoEstado
      // Opcional: podrías poner la FechaUltimoPago en null, pero mejor dejarla quieta
    })
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
