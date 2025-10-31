import { Request, Response } from "express";
import prisma from "../prisma/client";
import { asyncHandler } from "../middlewares/asyncHandler";
import { any } from "zod";

// Obtener todos los préstamos
export const getPrestamos = asyncHandler(async (req: Request, res: Response) => {
  const prestamos = await prisma.prestamo.findMany({
    include: {
      Cliente: true,
      Prestatario: true,
    },
  });
  res.json(prestamos);
});

// Obtener un préstamo por ID
export const getPrestamoById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const prestamo = await prisma.prestamo.findUnique({
    where: { IdPrestamo: Number(id) },
    include: {
      Cliente: true,
      Prestatario: true,
    },
  });

  if (!prestamo) {
    res.status(404);
    throw new Error("Préstamo no encontrado");
  }

  res.json(prestamo);
});

// Crear préstamo
// Crear préstamo con registro en consolidación
// Crear préstamo y consolidación
// Crear préstamo y su registro de consolidación
export const createPrestamo = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  // 1. Crear préstamo
  const nuevoPrestamo = await prisma.prestamo.create({
    data: {
      ...data,
    },
  });

  // 2. Fecha actual
  const hoy = new Date();

  // 3. Buscar consolidación activa (hoy dentro del rango de la consolidación)
  const consolidacion = await prisma.consolidacionCapital.findFirst({
    where: {
      FechaInicio: { lte: hoy },
      FechaFin: { gte: hoy },
    },
    orderBy: { FechaInicio: "desc" },
  });

  if (!consolidacion) {
    return res.status(400).json({
      error: "No existe una consolidación activa para la fecha actual.",
    });
  }

  // 4. Crear registro dentro de esa consolidación
  await prisma.registroConsolidacion.create({
    data: {
      IdConsolidacion: consolidacion.IdConsolidacion,
      FechaRegistro: hoy,
      TipoRegistro: "prestamo",
      Estado: "egreso",
      Descripcion: `Préstamo creado ID: ${nuevoPrestamo.IdPrestamo}`,
      Monto: data.MontoPrestado,
    },
  });

  res.status(201).json({
    success: true,
    prestamo: nuevoPrestamo,
  });
});



// Actualizar préstamo
export const updatePrestamo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const prestamo = await prisma.prestamo.update({
    where: { IdPrestamo: Number(id) },
    data,
  });

  res.json(prestamo);
});

// Eliminar préstamo
export const deletePrestamo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const idPrestamo = Number(id);

  try {
    // Verificar que el préstamo existe
    const prestamo = await prisma.prestamo.findUnique({
      where: { IdPrestamo: idPrestamo },
      include: {
        Pagos: true,
        PagosPersonalizados: true,
        Acuerdos: true,
        Volantes: true
      }
    });

    if (!prestamo) {
      return res.status(404).json({ error: "Préstamo no encontrado" });
    }

    // Usar transacción para eliminar todo en orden
    await prisma.$transaction(async (tx) => {
      
      // 1. Eliminar Volantes (dependen de Pagos y Prestamo)
      if (prestamo.Volantes.length > 0) {
        await tx.volante.deleteMany({
          where: { IdPrestamo: idPrestamo }
        });
      }

      // 2. Eliminar Pagos
      if (prestamo.Pagos.length > 0) {
        await tx.pago.deleteMany({
          where: { IdPrestamo: idPrestamo }
        });
      }

      // 3. Eliminar Acuerdos
      if (prestamo.Acuerdos.length > 0) {
        await tx.acuerdoPrestamo.deleteMany({
          where: { IdPrestamo: idPrestamo }
        });
      }

      // 4. Eliminar Pagos Personalizados
      if (prestamo.PagosPersonalizados.length > 0) {
        await tx.pagoPersonalizado.deleteMany({
          where: { IdPrestamo: idPrestamo }
        });
      }

      // 5. Finalmente eliminar el Préstamo
      await tx.prestamo.delete({
        where: { IdPrestamo: idPrestamo }
      });
    });

    res.json({ 
      success: true,
      message: "Préstamo y todos sus registros relacionados eliminados correctamente",
      eliminados: {
        prestamo: 1,
        pagos: prestamo.Pagos.length,
        acuerdos: prestamo.Acuerdos.length,
        pagosPersonalizados: prestamo.PagosPersonalizados.length,
        volantes: prestamo.Volantes.length
      }
    });

  } catch (error) {
    console.error("Error eliminando préstamo:", error);
    res.status(500).json({ 
      error: "Error eliminando préstamo", 
      details: error
    });
  }
});

// Función adicional para obtener información antes de eliminar
export const getPrestamoParaEliminar = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const idPrestamo = Number(id);

  try {
    const prestamo = await prisma.prestamo.findUnique({
      where: { IdPrestamo: idPrestamo },
      include: {
        Cliente: { select: { Nombre: true } },
        Prestatario: { select: { Nombre: true } },
        Pagos: { select: { IdPago: true, FechaPago: true, MontoPagado: true } },
        PagosPersonalizados: { select: { IdPagoPersonalizado: true } },
        Acuerdos: { select: { IdAcuerdo: true, FechaAcuerdo: true, MontoSaldado: true } },
        Volantes: { select: { IdVolante: true, TipoVolante: true } }
      }
    });

    if (!prestamo) {
      return res.status(404).json({ error: "Préstamo no encontrado" });
    }

    res.json({
      success: true,
      prestamo: {
        id: prestamo.IdPrestamo,
        cliente: prestamo.Cliente.Nombre,
        prestatario: prestamo.Prestatario.Nombre,
        monto: prestamo.MontoPrestado,
        estado: prestamo.Estado
      },
      registrosRelacionados: {
        pagos: prestamo.Pagos.length,
        acuerdos: prestamo.Acuerdos.length,
        pagosPersonalizados: prestamo.PagosPersonalizados.length,
        volantes: prestamo.Volantes.length
      },
      detalles: {
        pagos: prestamo.Pagos,
        acuerdos: prestamo.Acuerdos,
        pagosPersonalizados: prestamo.PagosPersonalizados.length,
        volantes: prestamo.Volantes.length
      },
      advertencia: "Al eliminar este préstamo se eliminarán TODOS los registros relacionados de forma permanente."
    });

  } catch (error) {
    console.error("Error obteniendo información del préstamo:", error);
    res.status(500).json({ 
      error: "Error obteniendo información", 
      details: error 
    });
  }
});


// Simular préstamo
export const simularPrestamo = async (req: Request, res: Response) => {
  try {
    const { monto, tasaInteres, numeroCuotas, tipoCalculo } = req.body;

    if (!monto || !tasaInteres || !numeroCuotas || !tipoCalculo) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    let cuotas: any[] = [];
    let montoTotalAPagar = 0;
    let montoTotalInteres = 0;

    switch (tipoCalculo.toLowerCase()) {
      case "capital+interes":
        {
          const interesPorCuota = monto * tasaInteres/100;
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
          // interés por cuota directo
          let interes = monto * tasaInteres/100;

          let laotraparte = 1 - Math.pow(1+ (tasaInteres/100), numeroCuotas);
          let MontoCuota = ((monto * (tasaInteres / 100))  / - laotraparte) + interes;
          let capital = 0;
          
          let balance = monto;

          // Calcular total a pagar
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
            interes = balance * tasaInteres/100;

          }

          // Calcular total de intereses sumando todos los intereses de las cuotas
          montoTotalInteres = cuotas.reduce((sum, cuota) => sum + cuota.interesMonto, 0);
        }
        break;

      default:
        return res.status(400).json({ error: "Tipo de cálculo no soportado" });
    }

    return res.json({
      success: true,
      resumen: {
        montoSolicitado: parseFloat(monto.toFixed(2)),
        tasaInteres: tasaInteres,
        numeroCuotas: numeroCuotas,
        tipoCalculo: tipoCalculo,
        montoTotalAPagar: parseFloat(montoTotalAPagar.toFixed(2)),
        montoTotalInteres: parseFloat(montoTotalInteres.toFixed(2)),
        montoCuota: cuotas.length > 0 ? cuotas[0].cuota : 0
      },
      cuotas,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error en simulación", details: error });
  }
};


//opciones prestamo
export const opcionesSimularPrestamoCapitalInteres = async (req: Request, res: Response) => {
  try {
    const { monto, tasaInteres, numeroCuotas } = req.body;

    if (!monto || !tasaInteres || !numeroCuotas) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    const prestamos: any[] = [];
    const interesPorCuota = monto * tasaInteres / 100;

    // ---- Prestamo 1: numeroCuotas - 2 (va primero)
    let cuotas: any[] = [];
    let capitalPorCuota = monto / (numeroCuotas - 2);
    let cuotaFija = capitalPorCuota + interesPorCuota;
    let montoTotalAPagar = cuotaFija * (numeroCuotas - 2);
    let montoTotalInteres = interesPorCuota * (numeroCuotas - 2);

    for (let i = 1; i <= numeroCuotas - 2; i++) {
      cuotas.push({
        numeroCuota: i,
        capital: parseFloat(capitalPorCuota.toFixed(2)),
        interes: parseFloat(interesPorCuota.toFixed(2)),
        cuota: parseFloat(cuotaFija.toFixed(2)),
      });
    }
    
    prestamos.push({ 
      nombre: "Prestamo 1", 
      resumen: {
        montoSolicitado: parseFloat(monto.toFixed(2)),
        tasaInteres: tasaInteres,
        numeroCuotas: numeroCuotas - 2,
        tipoCalculo: "capital+interes",
        montoTotalAPagar: parseFloat(montoTotalAPagar.toFixed(2)),
        montoTotalInteres: parseFloat(montoTotalInteres.toFixed(2)),
        montoCuota: parseFloat(cuotaFija.toFixed(2))
      },
      cuotas 
    });

    // ---- Prestamo 2: numeroCuotas exacto
    cuotas = [];
    capitalPorCuota = monto / numeroCuotas;
    cuotaFija = capitalPorCuota + interesPorCuota;
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
    
    prestamos.push({ 
      nombre: "Prestamo 2", 
      resumen: {
        montoSolicitado: parseFloat(monto.toFixed(2)),
        tasaInteres: tasaInteres,
        numeroCuotas: numeroCuotas,
        tipoCalculo: "capital+interes",
        montoTotalAPagar: parseFloat(montoTotalAPagar.toFixed(2)),
        montoTotalInteres: parseFloat(montoTotalInteres.toFixed(2)),
        montoCuota: parseFloat(cuotaFija.toFixed(2))
      },
      cuotas 
    });

    // ---- Prestamo 3: numeroCuotas + 2
    cuotas = [];
    capitalPorCuota = monto / (numeroCuotas + 2);
    cuotaFija = capitalPorCuota + interesPorCuota;
    montoTotalAPagar = cuotaFija * (numeroCuotas + 2);
    montoTotalInteres = interesPorCuota * (numeroCuotas + 2);

    for (let i = 1; i <= numeroCuotas + 2; i++) {
      cuotas.push({
        numeroCuota: i,
        capital: parseFloat(capitalPorCuota.toFixed(2)),
        interes: parseFloat(interesPorCuota.toFixed(2)),
        cuota: parseFloat(cuotaFija.toFixed(2)),
      });
    }
    
    prestamos.push({ 
      nombre: "Prestamo 3", 
      resumen: {
        montoSolicitado: parseFloat(monto.toFixed(2)),
        tasaInteres: tasaInteres,
        numeroCuotas: numeroCuotas + 2,
        tipoCalculo: "capital+interes",
        montoTotalAPagar: parseFloat(montoTotalAPagar.toFixed(2)),
        montoTotalInteres: parseFloat(montoTotalInteres.toFixed(2)),
        montoCuota: parseFloat(cuotaFija.toFixed(2))
      },
      cuotas 
    });

    return res.json({
      success: true,
      prestamos,
    });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error en simulación", details: error });
  }
};


//Recalcular el interés del prestamo para ajustar el monto de cuotas
export const calcularTasaPorCuota = async (req: Request, res: Response) => {
  try {
    const { monto, cuotaDeseada, numeroCuotas, tipoCalculo } = req.body;

    if (!monto || !cuotaDeseada || !numeroCuotas || !tipoCalculo) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // Función para calcular la cuota dado una tasa
    const calcularCuotaPorTasa = (tasa: number): number => {
      switch (tipoCalculo.toLowerCase()) {
        case "capital+interes":
          const interesPorCuota = monto * tasa / 100;
          const capitalPorCuota = monto / numeroCuotas;
          return capitalPorCuota + interesPorCuota;

        case "amortizable":
          if (tasa === 0) return monto / numeroCuotas;
          const tasaDecimal = tasa / 100;
          const factor = Math.pow(1 + tasaDecimal, numeroCuotas);
          return (monto * tasaDecimal * factor) / (factor - 1);

        default:
          throw new Error("Tipo de cálculo no soportado");
      }
    };

    // Método de bisección para encontrar la tasa correcta
    let tasaMin = 0;
    let tasaMax = 100; // 100% anual como máximo
    let tasaMedia = 0;
    let cuotaCalculada = 0;
    let iteraciones = 0;
    const maxIteraciones = 100;
    const precision = 0.01; // Precisión de 1 centavo

    while (iteraciones < maxIteraciones) {
      tasaMedia = (tasaMin + tasaMax) / 2;
      cuotaCalculada = calcularCuotaPorTasa(tasaMedia);

      // Si la diferencia es menor a la precisión, hemos encontrado la respuesta
      if (Math.abs(cuotaCalculada - cuotaDeseada) < precision) {
        break;
      }

      // Ajustar el rango de búsqueda
      if (cuotaCalculada > cuotaDeseada) {
        tasaMax = tasaMedia;
      } else {
        tasaMin = tasaMedia;
      }

      iteraciones++;
    }

    // Verificar si encontramos una solución válida
    if (iteraciones >= maxIteraciones) {
      return res.status(400).json({ 
        error: "No se pudo encontrar una tasa válida para la cuota deseada" 
      });
    }

    // Generar el plan de pagos con la tasa calculada
    const generarPlanPagos = (tasa: number) => {
      let cuotas: any[] = [];

      switch (tipoCalculo.toLowerCase()) {
        case "capital+interes":
          {
            const interesPorCuota = monto * tasa / 100;
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
                balance: parseFloat(Math.max(0, balance).toFixed(2)), // Evitar balances negativos por redondeo
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

    return res.json({
      success: true,
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
        tipoCalculo
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      error: "Error en el cálculo de tasa", 
    });
  }
};

// Función auxiliar para validar que la cuota deseada sea razonable
export const validarCuotaDeseada = (monto: number, cuotaDeseada: number, numeroCuotas: number): boolean => {
  const cuotaMinima = monto / numeroCuotas; // Solo capital, sin interés
  const cuotaMaximaRazonable = monto; // Una cuota no debería ser mayor al monto total
  
  return cuotaDeseada >= cuotaMinima && cuotaDeseada <= cuotaMaximaRazonable;
};

// Endpoint adicional para obtener el rango válido de cuotas
export const obtenerRangoCuotas = async (req: Request, res: Response) => {
  try {
    const { monto, numeroCuotas } = req.body;

    if (!monto || !numeroCuotas) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    const cuotaMinima = monto / numeroCuotas;
    const cuotaMaximaSugerida = cuotaMinima * 2; // Sugerencia práctica

    return res.json({
      success: true,
      cuotaMinima: parseFloat(cuotaMinima.toFixed(2)),
      cuotaMaximaSugerida: parseFloat(cuotaMaximaSugerida.toFixed(2)),
      mensaje: "La cuota mínima cubre solo el capital. La cuota máxima sugerida es el doble para mantener tasas razonables."
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      error: "Error al calcular rango de cuotas", 
    });
  }
};



        