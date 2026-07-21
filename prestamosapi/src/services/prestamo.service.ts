import { logger } from '../utils/logger';
import { supabase } from "../config/supabaseClient";
import * as capitalJobService from './capitaljob.service';

// --- INTERFACES ---
interface CreatePrestamoData {
  IdCliente: number;
  IdPrestatario: number;
  MontoPrestado: number;
  InteresPorcentaje: number;
  CantidadCuotas: number;
  ModalidadPago: string;
  FechaInicio: string;
  FechaFinEstimada: string;
  Observaciones?: string;
  TipoCalculo: string; // 'amortizable' | 'capital+interes'
  // Datos opcionales calculados
  InteresMontoTotal?: number;
  CapitalTotalPagar?: number;
  MontoCuota?: number;
  CapitalRestante?: number;
  CuotasRestantes?: number;
  TablaPagos?: string; // JSON string
  Estado?: string;
  IdEmpresa?: number;
}

// ==========================================
// 1. CRUD BÁSICO (Ya lo tenías, lo mantengo)
// ==========================================

export const createPrestamoService = async (data: CreatePrestamoData, idEmpresa: number, isSuperAdmin: boolean = false) => {
  if (!isSuperAdmin) {
    const { data: suscripcion } = await supabase
      .from('Suscripcion')
      .select('Plan:IdPlan (LimitePrestamos)')
      .eq('IdEmpresa', idEmpresa)
      .eq('Estado', 'Activa')
      .order('IdSuscripcion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!suscripcion || !suscripcion.Plan) {
      throw new Error('La empresa no cuenta con una suscripción activa.');
    }

    const plan: any = Array.isArray(suscripcion.Plan) ? suscripcion.Plan[0] : suscripcion.Plan;

    const { count } = await supabase
      .from('Prestamo')
      .select('*', { count: 'exact', head: true })
      .eq('IdEmpresa', idEmpresa)
      .eq('Estado', 'Activo');

    if ((count || 0) >= plan.LimitePrestamos) {
      throw new Error('Límite de préstamos activos de su plan excedido.');
    }
  }

  const hoy = new Date().toISOString();

  // 1. INTENTAR OBTENER CAJA ABIERTA
  let { data: consolidacion } = await supabase
    .from("ConsolidacionCapital")
    .select("IdConsolidacion")
    .eq("IdEmpresa", idEmpresa)
    .lte("FechaInicio", hoy)
    .gte("FechaFin", hoy)
    .order("FechaInicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 🚨 PLAN DE EMERGENCIA: SI NO HAY CAJA, LA CREAMOS AHORA MISMO
  if (!consolidacion) {
    logger.info("⚠️ Caja cerrada detectada al crear préstamo. Ejecutando apertura de emergencia...");
    try {
      // Llamamos al servicio que creamos antes
      const nuevaCaja = await capitalJobService.checkAndCreateConsolidation(idEmpresa);

      if (nuevaCaja && nuevaCaja.IdConsolidacion) {
        consolidacion = { IdConsolidacion: nuevaCaja.IdConsolidacion };
        logger.info("✅ Caja de emergencia creada y asignada.");
      }
    } catch (e) {
      logger.error("❌ Falló la apertura de emergencia:", e);
    }
  }

  // Si después del intento sigue sin haber consolidación, ahí sí lanzamos error
  if (!consolidacion) {
    throw new Error("ERROR CRÍTICO: No se pudo abrir la caja del día automáticamente. Verifica el sistema.");
  }

  // 2. Obtener Cliente
  const { data: cliente } = await supabase
    .from("Cliente")
    .select("Nombre")
    .eq("IdCliente", data.IdCliente)
    .eq("IdEmpresa", idEmpresa)
    .single();

  if (!cliente) throw new Error("Cliente no encontrado.");

  // 3. Crear Préstamo
  const { data: nuevoPrestamo, error: errorPrestamo } = await supabase
    .from("Prestamo")
    .insert(data)
    .select()
    .single();

  if (errorPrestamo) throw new Error(errorPrestamo.message);

  // 4. Registrar Salida de dinero (Egreso)
  const { error: errorRegistro } = await supabase
    .from("RegistroConsolidacion")
    .insert({
      IdConsolidacion: consolidacion.IdConsolidacion,
      FechaRegistro: hoy,
      TipoRegistro: "Egreso",
      Estado: "Prestado",
      Descripcion: `Préstamo - ${cliente.Nombre}`,
      Monto: data.MontoPrestado,
    });

  if (errorRegistro) throw new Error(`Error contable: ${errorRegistro.message}`);

  return nuevoPrestamo;
};

export const getPrestamosService = async (idEmpresa: number) => {
  const { data, error } = await supabase
    .from("Prestamo")
    .select(`*, Cliente(Nombre), Prestatario(Nombre)`)
    .eq("IdEmpresa", idEmpresa)
    .order("IdPrestamo", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((p: any) => ({
    ...p,
    clienteNombre: p.Cliente?.Nombre || 'N/A',
    prestatarioNombre: p.Prestatario?.Nombre || 'N/A'
  }));
};

export const getPrestamoByIdService = async (id: number, idEmpresa: number) => {
  const { data, error } = await supabase
    .from("Prestamo")
    .select(`*, Cliente(*), Prestatario(*)`)
    .eq("IdPrestamo", id)
    .eq("IdEmpresa", idEmpresa)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updatePrestamoService = async (id: number, idEmpresa: number, data: any) => {
  const { data: updated, error } = await supabase
    .from("Prestamo")
    .update(data)
    .eq("IdPrestamo", id)
    .eq("IdEmpresa", idEmpresa)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return updated;
};

export const deletePrestamoService = async (id: number, idEmpresa: number) => {
  // Verificamos propiedad de la empresa primero
  const prest = await getPrestamoByIdService(id, idEmpresa);
  if (!prest) throw new Error("No tienes permisos o no existe");

  // Primero borramos registros hijos para evitar errores de FK si no tienes Cascade
  await supabase.from("Pago").delete().eq("IdPrestamo", id);
  await supabase.from("Volantes").delete().eq("IdPrestamo", id);
  // Borrar préstamo
  const { error } = await supabase.from("Prestamo").delete().eq("IdPrestamo", id);
  if (error) throw new Error(error.message);
  return true;
};


// ==========================================
// 2. FUNCIONES AVANZADAS (LAS QUE FALTABAN)
// ==========================================

// A. Obtener detalles completos para eliminar
export const getPrestamoConDetallesService = async (id: number, idEmpresa: number) => {
  const { data, error } = await supabase
    .from("Prestamo")
    .select(`
        IdPrestamo, MontoPrestado, Estado,
        Cliente (Nombre),
        Prestatario (Nombre),
        Pagos (IdPago),
        Acuerdos (IdAcuerdo),
        PagosPersonalizados (IdPagoPersonalizado),
        Volantes (IdVolante)
    `)
    .eq("IdPrestamo", id)
    .eq("IdEmpresa", idEmpresa)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Préstamo no encontrado");

  return data;
};

// B. Lógica de Simulación Matemática
export const simularPrestamoService = (params: {
  monto: number;
  tasaInteres: number;
  numeroCuotas: number;
  tipoCalculo: string;
  cuotaDeseada?: number;
}) => {
  const { monto, tasaInteres, numeroCuotas, tipoCalculo, cuotaDeseada } = params;
  let cuotas = [];
  let montoCuota = 0;
  let totalInteres = 0;
  let totalPagar = 0;

  const i = tasaInteres / 100;

  if (cuotaDeseada && cuotaDeseada > 0) {
    montoCuota = cuotaDeseada;
  } else if (tipoCalculo === "solo_interes") {
    // Solo Interés: La cuota obligatoria por periodo es exclusivamente el interés del principal
    montoCuota = monto * i;
  } else if (tipoCalculo === "amortizable") {
    if (i === 0) {
      montoCuota = monto / numeroCuotas;
    } else {
      montoCuota = monto * ((i * Math.pow(1 + i, numeroCuotas)) / (Math.pow(1 + i, numeroCuotas) - 1));
    }
  } else {
    // FLAT
    const interesPorCuota = monto * i;
    const capitalPorCuota = monto / numeroCuotas;
    montoCuota = capitalPorCuota + interesPorCuota;
  }

  if (tipoCalculo === "solo_interes") {
    const interesPorCuota = cuotaDeseada && cuotaDeseada > 0 ? cuotaDeseada : (monto * i);
    totalInteres = interesPorCuota * numeroCuotas;
    totalPagar = monto + totalInteres;

    let saldo = monto;
    for (let j = 1; j <= numeroCuotas; j++) {
      const esUltima = (j === numeroCuotas);
      const cap = esUltima ? saldo : 0;
      const interesPeriodo = interesPorCuota;
      const cuotaActual = interesPeriodo + cap;
      const nuevoSaldo = esUltima ? 0 : saldo;

      cuotas.push({
        numeroCuota: j,
        cuota: Number(cuotaActual.toFixed(2)),
        interes: Number(interesPeriodo.toFixed(2)),
        capital: Number(cap.toFixed(2)),
        saldo: Number(nuevoSaldo.toFixed(2))
      });
    }

  } else if (tipoCalculo === "amortizable") {
    let saldo = monto;
    totalPagar = montoCuota * numeroCuotas;
    totalInteres = totalPagar - monto;

    for (let j = 1; j <= numeroCuotas; j++) {
      const interesPeriodo = saldo * i;
      let capitalPeriodo = montoCuota - interesPeriodo;

      if (j === numeroCuotas) {
        capitalPeriodo = saldo;
      }

      let nuevoSaldo = saldo - capitalPeriodo;
      if (j === numeroCuotas || nuevoSaldo < 0) nuevoSaldo = 0;

      const cuotaActual = capitalPeriodo + interesPeriodo;

      cuotas.push({
        numeroCuota: j,
        cuota: Number(cuotaActual.toFixed(2)),
        interes: Number(interesPeriodo.toFixed(2)),
        capital: Number(capitalPeriodo.toFixed(2)),
        saldo: Number(nuevoSaldo.toFixed(2))
      });
      saldo = nuevoSaldo;
    }

  } else {
    // FLAT
    const interesPorCuota = monto * i;
    const capitalPorCuota = monto / numeroCuotas;

    totalInteres = (cuotaDeseada ? (cuotaDeseada - capitalPorCuota) : interesPorCuota) * numeroCuotas;
    totalPagar = monto + totalInteres;

    let saldo = monto;
    for (let j = 1; j <= numeroCuotas; j++) {
      let cap = capitalPorCuota;
      if (j === numeroCuotas) cap = saldo;

      saldo -= cap;
      const cuotaActual = cuotaDeseada ? cuotaDeseada : (cap + interesPorCuota);

      cuotas.push({
        numeroCuota: j,
        cuota: Number(cuotaActual.toFixed(2)),
        interes: Number((cuotaActual - cap).toFixed(2)),
        capital: Number(cap.toFixed(2)),
        saldo: saldo > 0 ? Number(saldo.toFixed(2)) : 0
      });
    }
  }

  return {
    montoSolicitado: monto,
    tasaInteres, // Guardar float real de precisión completa
    tasaDisplay: Number(tasaInteres.toFixed(2)), // Tasa formateada a 2 decimales para la UI
    numeroCuotas,
    tipoCalculo,
    montoCuota: Number(montoCuota.toFixed(2)),
    montoTotalInteres: Number(totalInteres.toFixed(2)),
    montoTotalAPagar: Number(totalPagar.toFixed(2)),
    tablaAmortizacion: cuotas
  };
};

// C. Opciones de Simulación (Generar varios escenarios)
export const opcionesSimularPrestamoService = (params: {
  monto: number;
  tasaInteres: number;
  numeroCuotas: number; // Cuota base
}) => {
  // Generamos 3 opciones: la pedida, +2 cuotas, +4 cuotas (ejemplo)
  const opcionesCuotas = [params.numeroCuotas, params.numeroCuotas + 2, params.numeroCuotas + 4];

  const resultados = opcionesCuotas.map(n => {
    return simularPrestamoService({
      monto: params.monto,
      tasaInteres: params.tasaInteres,
      numeroCuotas: n,
      tipoCalculo: 'capital+interes' // Por defecto para esta vista rápida
    });
  });

  return resultados;
};

// D. Calcular Tasa Inversa (Dado un monto de cuota, hallar el %)
export const calcularTasaPorCuotaService = (params: {
  monto: number;
  cuotaDeseada: number;
  numeroCuotas: number;
  tipoCalculo: string;
}) => {
  const { monto, cuotaDeseada, numeroCuotas, tipoCalculo } = params;

  let tasaEncontrada = 0;

  if (tipoCalculo === 'solo_interes') {
    // En solo_interes, la cuota deseada es la cuota de interés directo
    tasaEncontrada = (cuotaDeseada / monto) * 100;
  } else if (tipoCalculo === 'capital+interes') {
    const capitalMinimo = monto / numeroCuotas;
    if (cuotaDeseada <= capitalMinimo) {
      throw new Error(`La cuota deseada debe ser mayor a RD$ ${capitalMinimo.toFixed(2)} para cubrir el capital.`);
    }
    const interesMonto = cuotaDeseada - capitalMinimo;
    tasaEncontrada = (interesMonto / monto) * 100;
  } else {
    // Amortizable (Búsqueda Binaria de ultra alta precisión)
    const capitalMinimo = monto / numeroCuotas;
    if (cuotaDeseada <= capitalMinimo) {
      throw new Error(`La cuota deseada debe ser mayor a RD$ ${capitalMinimo.toFixed(2)} para cubrir el capital.`);
    }
    let low = 0;
    let high = 500;
    let epsilon = 0.00001; // Ultra preciso (0.001 centavo)

    for (let i = 0; i < 100; i++) {
      let mid = (low + high) / 2;
      const sim = simularPrestamoService({
        monto, tasaInteres: mid, numeroCuotas, tipoCalculo: 'amortizable'
      });

      if (Math.abs(sim.montoCuota - cuotaDeseada) < epsilon) {
        tasaEncontrada = mid;
        break;
      } else if (sim.montoCuota < cuotaDeseada) {
        low = mid;
      } else {
        high = mid;
      }
      tasaEncontrada = mid;
    }
  }

  // Redondeamos a 4 decimales (estándar bancario/financiero) para evitar feos artefactos flotantes de 16 dígitos
  const tasaCuatroDecimales = Number(tasaEncontrada.toFixed(4));

  const simulacionAjustada = simularPrestamoService({
    monto,
    tasaInteres: tasaCuatroDecimales,
    numeroCuotas,
    tipoCalculo,
    cuotaDeseada
  });

  return {
    ...simulacionAjustada,
    tasaCalculada: tasaCuatroDecimales,
    tasaInteres: tasaCuatroDecimales,
    tasaDisplay: Number(tasaCuatroDecimales.toFixed(2)),
    cuotaObjetivo: cuotaDeseada
  };
};

// E. Obtener Rango de Cuotas
export const obtenerRangoCuotasService = (params: { monto: number, numeroCuotas: number }) => {
  if (params.numeroCuotas <= 0) throw new Error("El número de cuotas debe ser un valor positivo");

  const cuotaMinima = params.monto / params.numeroCuotas; // 0% interés
  const cuotaMaximaSugerida = cuotaMinima * 2; // Ejemplo: hasta 100% de interés total (muy alto, pero es un techo)

  return {
    cuotaMinima: Number(cuotaMinima.toFixed(2)),
    cuotaMaximaSugerida: Number(cuotaMaximaSugerida.toFixed(2))
  };
};

export const countPrestamosActivosByPrestatarioService = async (idPrestatario: number, idEmpresa: number) => {
  const { count, error } = await supabase
    .from("Prestamo")
    .select("*", { count: "exact", head: true }) // 'head: true' significa "solo dame el número, no los datos"
    .eq("IdPrestatario", idPrestatario)
    .eq("IdEmpresa", idEmpresa)
    .eq("Estado", "Activo"); // O el estado que uses para definir 'Activo'

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
};