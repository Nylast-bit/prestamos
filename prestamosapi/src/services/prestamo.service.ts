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
}

// ==========================================
// 1. CRUD BÁSICO (Ya lo tenías, lo mantengo)
// ==========================================

export const createPrestamoService = async (data: CreatePrestamoData) => {
  const hoy = new Date().toISOString();

  // 1. INTENTAR OBTENER CAJA ABIERTA
  let { data: consolidacion } = await supabase
    .from("ConsolidacionCapital")
    .select("IdConsolidacion")
    .lte("FechaInicio", hoy)
    .gte("FechaFin", hoy)
    .order("FechaInicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 🚨 PLAN DE EMERGENCIA: SI NO HAY CAJA, LA CREAMOS AHORA MISMO
  if (!consolidacion) {
      console.log("⚠️ Caja cerrada detectada al crear préstamo. Ejecutando apertura de emergencia...");
      try {
          // Llamamos al servicio que creamos antes
          const nuevaCaja = await capitalJobService.checkAndCreateConsolidation();
          
          if (nuevaCaja && nuevaCaja.IdConsolidacion) {
              consolidacion = { IdConsolidacion: nuevaCaja.IdConsolidacion };
              console.log("✅ Caja de emergencia creada y asignada.");
          }
      } catch (e) {
          console.error("❌ Falló la apertura de emergencia:", e);
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

export const getPrestamosService = async () => {
  const { data, error } = await supabase
    .from("Prestamo")
    .select(`*, Cliente(Nombre), Prestatario(Nombre)`)
    .order("IdPrestamo", { ascending: false });

  if (error) throw new Error(error.message);
  
  return data.map((p: any) => ({
    ...p,
    clienteNombre: p.Cliente?.Nombre || 'N/A',
    prestatarioNombre: p.Prestatario?.Nombre || 'N/A'
  }));
};

export const getPrestamoByIdService = async (id: number) => {
  const { data, error } = await supabase
    .from("Prestamo")
    .select(`*, Cliente(*), Prestatario(*)`)
    .eq("IdPrestamo", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const updatePrestamoService = async (id: number, data: any) => {
  const { data: updated, error } = await supabase
    .from("Prestamo")
    .update(data)
    .eq("IdPrestamo", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return updated;
};

export const deletePrestamoService = async (id: number) => {
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
export const getPrestamoConDetallesService = async (id: number) => {
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
}) => {
  const { monto, tasaInteres, numeroCuotas, tipoCalculo } = params;
  let cuotas = [];
  let montoCuota = 0;
  let totalInteres = 0;
  let totalPagar = 0;

  if (tipoCalculo === "amortizable") {
    const i = tasaInteres / 100;
    if (i === 0) {
        montoCuota = monto / numeroCuotas;
    } else {
        montoCuota = monto * ( (i * Math.pow(1 + i, numeroCuotas)) / (Math.pow(1 + i, numeroCuotas) - 1) );
    }

    let saldo = monto;
    totalPagar = montoCuota * numeroCuotas;
    totalInteres = totalPagar - monto;

    for (let j = 1; j <= numeroCuotas; j++) {
      const interesPeriodo = saldo * i;
      const capitalPeriodo = montoCuota - interesPeriodo;
      
      let nuevoSaldo = saldo - capitalPeriodo;
      if (j === numeroCuotas) nuevoSaldo = 0; // Ajuste final

      cuotas.push({
        numeroCuota: j,
        cuota: Number(montoCuota.toFixed(2)),
        interes: Number(interesPeriodo.toFixed(2)),
        capital: Number(capitalPeriodo.toFixed(2)),
        saldo: nuevoSaldo > 0 ? Number(nuevoSaldo.toFixed(2)) : 0
      });
      saldo = nuevoSaldo;
    }

  } else {
    // FLAT
    const interesPorCuota = monto * (tasaInteres / 100);
    const capitalPorCuota = monto / numeroCuotas;
    montoCuota = capitalPorCuota + interesPorCuota;
    
    totalInteres = interesPorCuota * numeroCuotas;
    totalPagar = monto + totalInteres;

    let saldo = monto;
    for (let j = 1; j <= numeroCuotas; j++) {
      saldo -= capitalPorCuota;
      cuotas.push({
        numeroCuota: j,
        cuota: Number(montoCuota.toFixed(2)),
        interes: Number(interesPorCuota.toFixed(2)),
        capital: Number(capitalPorCuota.toFixed(2)),
        saldo: saldo > 0 ? Number(saldo.toFixed(2)) : 0
      });
    }
  }

  return {
    montoSolicitado: monto,
    tasaInteres,
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
    
    // Validación inicial: La cuota debe cubrir al menos el capital
    const capitalMinimo = monto / numeroCuotas;
    if (cuotaDeseada <= capitalMinimo) {
        throw new Error("La cuota deseada es muy baja, no cubre el capital.");
    }

    let tasaEncontrada = 0;

    if (tipoCalculo === 'capital+interes') {
        // Fórmula directa: Cuota = (Monto/n) + (Monto * Tasa/100)
        // Despejando Tasa:
        // InteresMonto = Cuota - (Monto/n)
        // Tasa = (InteresMonto / Monto) * 100
        const interesMonto = cuotaDeseada - capitalMinimo;
        tasaEncontrada = (interesMonto / monto) * 100;

    } else {
        // Amortizable (Newton-Raphson o Búsqueda Binaria)
        // Usaremos búsqueda binaria simple entre 0% y 100% mensual
        let low = 0;
        let high = 100;
        let epsilon = 0.001; // Precisión
        
        for(let i=0; i<100; i++) { // Max 100 iteraciones
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

    return {
        monto,
        numeroCuotas,
        cuotaObjetivo: cuotaDeseada,
        tasaCalculada: Number(tasaEncontrada.toFixed(2)),
        tipoCalculo
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

export const countPrestamosActivosByPrestatarioService = async (idPrestatario: number) => {
  const { count, error } = await supabase
    .from("Prestamo")
    .select("*", { count: "exact", head: true }) // 'head: true' significa "solo dame el número, no los datos"
    .eq("IdPrestatario", idPrestatario)
    .eq("Estado", "Activo"); // O el estado que uses para definir 'Activo'

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
};