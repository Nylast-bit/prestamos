// src/services/prestamo.service.ts
import prisma from "../prisma/client";
import { supabase } from "../config/supabaseClient";
import { z } from "zod";
// Asumo que tu schema de Zod está aquí
import { prestamoSchema } from "../validators/prestamo.validator";

type CreatePrestamoData = z.infer<typeof prestamoSchema>;
type UpdatePrestamoData = z.infer<typeof prestamoSchema>;

interface SimulacionInput {
  monto: number;
  tasaInteres: number;
  numeroCuotas: number;
  tipoCalculo: string;
}

interface OpcionesSimulacionInput {
  monto: number;
  tasaInteres: number;
  numeroCuotas: number;
}

interface TasaPorCuotaInput {
  monto: number;
  cuotaDeseada: number;
  numeroCuotas: number;
  tipoCalculo: string;
}

interface RangoCuotasInput {
  monto: number;
  numeroCuotas: number;
}

 // 1. OBTENER TODOS LOS PRÉSTAMOS

export const getPrestamosService = async () => {
  // 2. Esta es la consulta de Supabase
  const { data: prestamos, error } = await supabase
    .from("prestamo") // Elige tu tabla
    .select(`
      *,
      Cliente(*),
      Prestatario(*)
    `);

  // 3. Supabase no lanza errores, los devuelve.
  // Debemos lanzarlo nosotros para que nuestro `asyncHandler` lo atrape.
  if (error) {
    console.error("Error en getPrestamosService:", error.message);
    throw new Error(error.message);
  }

  // Regla 2: El servicio DEVUELVE datos.
  return prestamos;
};


 // 2. OBTENER UN PRÉSTAMO POR ID

export const getPrestamoByIdService = async (id: number) => {
  const { data: prestamo, error } = await supabase
    .from("prestamo")
    .select(`
      *,
      Cliente(*),
      Prestatario(*)
    `)
    .eq("IdPrestamo", id) // Esto es el "where"
    .single(); // .single() espera 1 resultado o null (en lugar de un array)

  // Manejo de errores
  if (error) {
    console.error(`Error en getPrestamoByIdService con id ${id}:`, error.message);
    // Si el error es porque no encontró, lanzamos un error 404
    if (error.code === 'PGRST116') { // 'PGRST116' es el código de Supabase para "not found" con .single()
         throw new Error("Préstamo no encontrado");
    }
    throw new Error(error.message);
  }

  // Regla 3: El servicio LANZA un error si no encuentra algo.
  // (En este caso, .single() lo hace por nosotros si no hay datos)
  if (!prestamo) {
    throw new Error("Préstamo no encontrado");
  }

  // Regla 2: El servicio DEVUELVE datos.
  return prestamo;
};

export const createPrestamoService = async (data: CreatePrestamoData) => {
  // 1. Crear préstamo
  // .select() le dice a Supabase que devuelva la fila recién creada
  // .single() nos da el objeto en lugar de un array
  const { data: nuevoPrestamo, error: errorPrestamo } = await supabase
    .from("prestamo")
    .insert(data)
    .select()
    .single();

  if (errorPrestamo) {
    console.error("Error creando préstamo:", errorPrestamo.message);
    throw new Error(errorPrestamo.message);
  }

  // 2. Fecha actual (en formato ISO para Supabase)
  const hoy = new Date().toISOString();

  // 3. Buscar consolidación activa
  // Traducimos el 'findFirst' con 'lte' (menor o igual) y 'gte' (mayor o igual)
  const { data: consolidacion, error: errorFind } = await supabase
    .from("consolidacionCapital")
    .select("*")
    .lte("FechaInicio", hoy)
    .gte("FechaFin", hoy)
    .order("FechaInicio", { ascending: false })
    .limit(1)
    .maybeSingle(); // .maybeSingle() devuelve null si no encuentra, sin error

  if (errorFind) {
    console.error("Error buscando consolidación:", errorFind.message);
    throw new Error(errorFind.message);
  }

  // Regla 3: Lanzamos el error de negocio
  if (!consolidacion) {
    // ¡PROBLEMA! El préstamo ya se creó. (Ver la nota de abajo)
    throw new Error("No existe una consolidación activa para la fecha actual.");
  }

  // 4. Crear registro dentro de esa consolidación
  const { error: errorRegistro } = await supabase
    .from("registroConsolidacion")
    .insert({
      IdConsolidacion: consolidacion.IdConsolidacion,
      FechaRegistro: hoy,
      TipoRegistro: "prestamo",
      Estado: "egreso",
      Descripcion: `Préstamo creado ID: ${nuevoPrestamo.IdPrestamo}`,
      Monto: data.MontoPrestado, // Asumo que esto viene en 'data'
    });

  if (errorRegistro) {
    console.error("Error creando registro:", errorRegistro.message);
    // ¡PROBLEMA MAYOR! El préstamo se creó pero el registro de consolidación falló.
    throw new Error(errorRegistro.message);
  }

  // Regla 2: El servicio DEVUELVE el préstamo creado
  return nuevoPrestamo;
};

export const updatePrestamoService = async (id: number, data: UpdatePrestamoData) => {
  
  const { data: prestamoActualizado, error } = await supabase
    .from("prestamo")
    .update(data)
    .eq("IdPrestamo", id) // El 'where'
    .select()             // Le pedimos que devuelva la fila actualizada
    .single();            // Esperamos un solo resultado

  // Manejo de errores
  if (error) {
    console.error(`Error actualizando préstamo ${id}:`, error.message);
    
    // 'PGRST116' es el código de Supabase (PostgREST)
    // cuando .single() no encuentra ninguna fila que coincida.
    if (error.code === 'PGRST116') {
      throw new Error("Préstamo no encontrado");
    }
    
    // Lanzamos cualquier otro error
    throw new Error(error.message);
  }

  // Regla 2: Devolver los datos actualizados
  return prestamoActualizado;
};

export const deletePrestamoService = async (id: number) => {
  
  // 1. Solo borramos el padre (el Préstamo)
  const { data, error } = await supabase
    .from("prestamo")
    .delete()
    .eq("IdPrestamo", id)
    .select() // Opcional: para saber qué se borró
    .single();

  // 2. Manejo de errores
  if (error) {
    console.error(`Error borrando préstamo ${id}:`, error.message);
    
    // 'PGRST116' es el código si no encontró el ID
    if (error.code === 'PGRST116') {
      throw new Error("Préstamo no encontrado");
    }
    throw new Error(error.message);
  }

  if (!data) {
     throw new Error("Préstamo no encontrado");
  }

  // 3. Devolver los datos del préstamo eliminado
  return { 
    success: true,
    message: "Préstamo y todas sus dependencias eliminados por CASCADE.",
    prestamoEliminado: data
  };
};

export const getPrestamoConDetallesService = async (id: number) => {
  
  const { data: prestamo, error } = await supabase
    .from("prestamo")
    .select(`
      IdPrestamo,
      MontoPrestado,
      Estado,
      Cliente ( * ), 
      Prestatario ( * ), 
      Pagos ( IdPago, FechaPago, MontoPagado ),
      PagosPersonalizados ( IdPagoPersonalizado ),
      Acuerdos ( IdAcuerdo, FechaAcuerdo, MontoSaldado ),
      Volantes ( IdVolante, TipoVolante )
    `)
    .eq("IdPrestamo", id)
    .single();

  // 2. Manejo de errores
  if (error) {
    console.error(`Error obteniendo detalles del préstamo ${id}:`, error.message);
    if (error.code === 'PGRST116') {
      throw new Error("Préstamo no encontrado");
    }
    throw new Error(error.message);
  }

  if (!prestamo) {
    throw new Error("Préstamo no encontrado");
  }

  // 3. Regla 2: Devolver los datos crudos de la BBDD
  return prestamo;
};

export const simularPrestamoService = (input: SimulacionInput) => {
  const { monto, tasaInteres, numeroCuotas, tipoCalculo } = input;

  let cuotas: any[] = [];
  let montoTotalAPagar = 0;
  let montoTotalInteres = 0;

  switch (tipoCalculo.toLowerCase()) {
    case "capital+interes":
      {
        const interesPorCuota = (monto * tasaInteres) / 100;
        const capitalPorCuota = monto / numeroCuotas;
        const cuotaFija = capitalPorCuota + interesPorCuota;

        // Calcular totales
        montoTotalAPagar = cuotaFija * numeroCuotas;
        montoTotalInteres = interesPorCuota * numeroCuotas;

        for (let i = 1; i <= numeroCuotas; i++) {
          cuotas.push({
            numeroCuota: i,
            capital: parseFloat(capitalPorCuota.toFixed(2)),
            interes: parseFloat(interesPorCuota.toFixed(2)),
            cuota: parseFloat(cuotaFija.toFixed(2)),
          });
        }
      }
      break;

    case "amortizable":
      {
        // (Toda tu lógica de amortización va aquí, tal cual la tenías)
        let interes = (monto * tasaInteres) / 100;
        let laotraparte = 1 - Math.pow(1 + tasaInteres / 100, numeroCuotas);
        let MontoCuota = (monto * (tasaInteres / 100)) / -laotraparte + interes;
        let capital = 0;
        let balance = monto;

        montoTotalAPagar = MontoCuota * numeroCuotas;

        for (let i = 1; i <= numeroCuotas; i++) {
          capital = MontoCuota - interes;
          balance = balance - capital;

          cuotas.push({
            NumeroCuota: i,
            cuota: parseFloat(MontoCuota.toFixed(2)),
            interesMonto: parseFloat(interes.toFixed(2)),
            capital: parseFloat(capital.toFixed(2)),
            balance: parseFloat(balance.toFixed(2)),
          });
          interes = balance * (tasaInteres / 100);
        }

        montoTotalInteres = cuotas.reduce(
          (sum, cuota) => sum + cuota.interesMonto,
          0
        );
      }
      break;

    default:
      // Regla 3: El servicio LANZA un error
      throw new Error("Tipo de cálculo no soportado");
  }

  // Regla 2: El servicio DEVUELVE los datos
  return {
    resumen: {
      montoSolicitado: parseFloat(monto.toFixed(2)),
      tasaInteres: tasaInteres,
      numeroCuotas: numeroCuotas,
      tipoCalculo: tipoCalculo,
      montoTotalAPagar: parseFloat(montoTotalAPagar.toFixed(2)),
      montoTotalInteres: parseFloat(montoTotalInteres.toFixed(2)),
      montoCuota: cuotas.length > 0 ? cuotas[0].cuota : 0,
    },
    cuotas,
  };
};

export const opcionesSimularPrestamoService = (input: OpcionesSimulacionInput) => {
  const { monto, tasaInteres, numeroCuotas } = input;

  // Validación de lógica de negocio:
  if (numeroCuotas <= 2) {
    throw new Error(
      "El número de cuotas debe ser mayor a 2 para esta simulación."
    );
  }

  const prestamos: any[] = [];
  const interesPorCuota = (monto * tasaInteres) / 100;

  // ---- Prestamo 1: numeroCuotas - 2 (va primero)
  let cuotas1: any[] = [];
  let capitalPorCuota1 = monto / (numeroCuotas - 2);
  let cuotaFija1 = capitalPorCuota1 + interesPorCuota;
  let montoTotalAPagar1 = cuotaFija1 * (numeroCuotas - 2);
  let montoTotalInteres1 = interesPorCuota * (numeroCuotas - 2);

  for (let i = 1; i <= numeroCuotas - 2; i++) {
    cuotas1.push({
      numeroCuota: i,
      capital: parseFloat(capitalPorCuota1.toFixed(2)),
      interes: parseFloat(interesPorCuota.toFixed(2)),
      cuota: parseFloat(cuotaFija1.toFixed(2)),
    });
  }

  prestamos.push({
    nombre: "Prestamo 1",
    resumen: {
      montoSolicitado: parseFloat(monto.toFixed(2)),
      tasaInteres: tasaInteres,
      numeroCuotas: numeroCuotas - 2,
      tipoCalculo: "capital+interes",
      montoTotalAPagar: parseFloat(montoTotalAPagar1.toFixed(2)),
      montoTotalInteres: parseFloat(montoTotalInteres1.toFixed(2)),
      montoCuota: parseFloat(cuotaFija1.toFixed(2)),
    },
    cuotas: cuotas1,
  });

  // ---- Prestamo 2: numeroCuotas exacto
  let cuotas2: any[] = [];
  let capitalPorCuota2 = monto / numeroCuotas;
  let cuotaFija2 = capitalPorCuota2 + interesPorCuota;
  let montoTotalAPagar2 = cuotaFija2 * numeroCuotas;
  let montoTotalInteres2 = interesPorCuota * numeroCuotas;

  for (let i = 1; i <= numeroCuotas; i++) {
    cuotas2.push({
      numeroCuota: i,
      capital: parseFloat(capitalPorCuota2.toFixed(2)),
      interes: parseFloat(interesPorCuota.toFixed(2)),
      cuota: parseFloat(cuotaFija2.toFixed(2)),
    });
  }

  prestamos.push({
    nombre: "Prestamo 2",
    resumen: {
      montoSolicitado: parseFloat(monto.toFixed(2)),
      tasaInteres: tasaInteres,
      numeroCuotas: numeroCuotas,
      tipoCalculo: "capital+interes",
      montoTotalAPagar: parseFloat(montoTotalAPagar2.toFixed(2)),
      montoTotalInteres: parseFloat(montoTotalInteres2.toFixed(2)),
      montoCuota: parseFloat(cuotaFija2.toFixed(2)),
    },
    cuotas: cuotas2,
  });

  // ---- Prestamo 3: numeroCuotas + 2
  let cuotas3: any[] = [];
  let capitalPorCuota3 = monto / (numeroCuotas + 2);
  let cuotaFija3 = capitalPorCuota3 + interesPorCuota;
  let montoTotalAPagar3 = cuotaFija3 * (numeroCuotas + 2);
  let montoTotalInteres3 = interesPorCuota * (numeroCuotas + 2);

  for (let i = 1; i <= numeroCuotas + 2; i++) {
    cuotas3.push({
      numeroCuota: i,
      capital: parseFloat(capitalPorCuota3.toFixed(2)),
      interes: parseFloat(interesPorCuota.toFixed(2)),
      cuota: parseFloat(cuotaFija3.toFixed(2)),
    });
  }

  prestamos.push({
    nombre: "Prestamo 3",
    resumen: {
      montoSolicitado: parseFloat(monto.toFixed(2)),
      tasaInteres: tasaInteres,
      numeroCuotas: numeroCuotas + 2,
      tipoCalculo: "capital+interes",
      montoTotalAPagar: parseFloat(montoTotalAPagar3.toFixed(2)),
      montoTotalInteres: parseFloat(montoTotalInteres3.toFixed(2)),
      montoCuota: parseFloat(cuotaFija3.toFixed(2)),
    },
    cuotas: cuotas3,
  });

  // Regla 2: El servicio DEVUELVE los datos (el array de préstamos)
  return prestamos;
};

export const calcularTasaPorCuotaService = (input: TasaPorCuotaInput) => {
  const { monto, cuotaDeseada, numeroCuotas, tipoCalculo } = input;

  // Función para calcular la cuota dado una tasa
  const calcularCuotaPorTasa = (tasa: number): number => {
    switch (tipoCalculo.toLowerCase()) {
      case "capital+interes":
        const interesPorCuota = (monto * tasa) / 100;
        const capitalPorCuota = monto / numeroCuotas;
        return capitalPorCuota + interesPorCuota;

      case "amortizable":
        if (tasa === 0) return monto / numeroCuotas;
        const tasaDecimal = tasa / 100;
        const factor = Math.pow(1 + tasaDecimal, numeroCuotas);
        return (monto * tasaDecimal * factor) / (factor - 1);

      default:
        // Regla 3: Lanzar error
        throw new Error("Tipo de cálculo no soportado");
    }
  };

  // Método de bisección para encontrar la tasa correcta
  let tasaMin = 0;
  let tasaMax = 100; // 100% como máximo
  let tasaMedia = 0;
  let cuotaCalculada = 0;
  let iteraciones = 0;
  const maxIteraciones = 100;
  const precision = 0.01; // Precisión de 1 centavo

  while (iteraciones < maxIteraciones) {
    tasaMedia = (tasaMin + tasaMax) / 2;
    cuotaCalculada = calcularCuotaPorTasa(tasaMedia);

    if (Math.abs(cuotaCalculada - cuotaDeseada) < precision) {
      break;
    }

    if (cuotaCalculada > cuotaDeseada) {
      tasaMax = tasaMedia;
    } else {
      tasaMin = tasaMedia;
    }

    iteraciones++;
  }

  // Verificar si encontramos una solución válida
  if (iteraciones >= maxIteraciones) {
    // Regla 3: Lanzar error
    throw new Error("No se pudo encontrar una tasa válida para la cuota deseada");
  }

  // Generar el plan de pagos con la tasa calculada
  const generarPlanPagos = (tasa: number) => {
    let cuotas: any[] = [];

    switch (tipoCalculo.toLowerCase()) {
      case "capital+interes":
        {
          const interesPorCuota = (monto * tasa) / 100;
          const capitalPorCuota = monto / numeroCuotas;

          for (let i = 1; i <= numeroCuotas; i++) {
            cuotas.push({
              numeroCuota: i,
              capital: parseFloat(capitalPorCuota.toFixed(2)),
              interes: parseFloat(interesPorCuota.toFixed(2)),
              cuota: parseFloat((capitalPorCuota + interesPorCuota).toFixed(2)),
            });
          }
        }
        break;

      case "amortizable":
        {
          const tasaDecimal = tasa / 100;
          const cuotaFija = cuotaDeseada;
          let balance = monto;

          for (let i = 1; i <= numeroCuotas; i++) {
            const interes = balance * tasaDecimal;
            const capital = cuotaFija - interes;
            balance = balance - capital;

            cuotas.push({
              NumeroCuota: i,
              cuota: parseFloat(cuotaFija.toFixed(2)),
              interesMonto: parseFloat(interes.toFixed(2)),
              capital: parseFloat(capital.toFixed(2)),
              balance: parseFloat(Math.max(0, balance).toFixed(2)),
            });
          }
        }
        break;
    }

    return cuotas;
  };

  const planPagos = generarPlanPagos(tasaMedia);

  // Calcular totales
  const totalAPagar = cuotaDeseada * numeroCuotas;
  const totalInteres = totalAPagar - monto;

  // Regla 2: El servicio DEVUELVE los datos
  return {
    tasaRealCalculada: parseFloat(tasaMedia.toFixed(4)),
    cuotaDeseada: cuotaDeseada,
    cuotaCalculada: parseFloat(cuotaCalculada.toFixed(2)),
    diferencia: parseFloat((cuotaCalculada - cuotaDeseada).toFixed(2)),
    totalAPagar: parseFloat(totalAPagar.toFixed(2)),
    totalInteres: parseFloat(totalInteres.toFixed(2)),
    iteracionesUsadas: iteraciones,
    cuotas: planPagos,
    parametrosOriginales: {
      monto,
      numeroCuotas,
      tipoCalculo,
    },
  };
};

export const validarCuotaDeseada = (monto: number, cuotaDeseada: number, numeroCuotas: number): boolean => {
  const cuotaMinima = monto / numeroCuotas; // Solo capital, sin interés
  const cuotaMaximaRazonable = monto; // Una cuota no debería ser mayor al monto total
  
  return cuotaDeseada >= cuotaMinima && cuotaDeseada <= cuotaMaximaRazonable;
};

export const obtenerRangoCuotasService = (input: RangoCuotasInput) => {
  const { monto, numeroCuotas } = input;

  // 1. Validación de Lógica de Negocio
  if (numeroCuotas <= 0) {
    throw new Error("El número de cuotas debe ser un valor positivo.");
  }

  // 2. Cálculo
  const cuotaMinima = monto / numeroCuotas;
  const cuotaMaximaSugerida = cuotaMinima * 2; // Sugerencia práctica

  // 3. Regla 2: Devolver los datos calculados
  return {
    cuotaMinima: parseFloat(cuotaMinima.toFixed(2)),
    cuotaMaximaSugerida: parseFloat(cuotaMaximaSugerida.toFixed(2)),
  };
};