// src/controllers/pago.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";

// Crear pago
export const createPago = async (req: Request, res: Response) => {
  try {
    const { IdPrestamo, TipoPago, Observaciones, IdConsolidacion } = req.body;

    // 1. Verificar que el préstamo existe
    const prestamo = await prisma.prestamo.findUnique({
      where: { IdPrestamo },
      select: {
        IdPrestamo: true,
        MontoPrestado: true,
        TipoCalculo: true,
        InteresPorcentaje: true,
        CapitalRestante: true,
        CantidadCuotas: true,
        CuotasRestantes: true,
        Estado: true,
      },
    });

    if (!prestamo) {
      return res.status(404).json({ error: "Préstamo no encontrado" });
    }

    // 2. Verificar que aún hay cuotas por pagar
    if (prestamo.CuotasRestantes <= 0 || prestamo.Estado === "Terminado") {
      return res
        .status(400)
        .json({ error: "El préstamo ya está completamente pagado" });
    }

    let datosDelPago;

    // 3. Calcular cuota según el tipo de cálculo
    if (prestamo.TipoCalculo?.toLowerCase() === "amortizable") {
      const cuotaActual = prestamo.CantidadCuotas - prestamo.CuotasRestantes + 1;

      const cuotas = calcularCuotasAmortizable(
        Number(prestamo.MontoPrestado),
        Number(prestamo.InteresPorcentaje),
        prestamo.CantidadCuotas
      );

      const cuotaAPagar = cuotas[cuotaActual - 1];
      if (!cuotaAPagar) {
        return res
          .status(400)
          .json({ error: "No se pudo calcular la cuota correspondiente" });
      }

      datosDelPago = {
        MontoPagado: cuotaAPagar.cuota,
        MontoInteresPagado: cuotaAPagar.interesMonto,
        MontoCapitalAbonado: cuotaAPagar.capital,
      };
    } else if (prestamo.TipoCalculo?.toLowerCase() === "capital+interes") {
      const interesPorCuota =
        Number(prestamo.MontoPrestado) *
        (Number(prestamo.InteresPorcentaje) / 100);
      const capitalPorCuota =
        Number(prestamo.MontoPrestado) / prestamo.CantidadCuotas;

      datosDelPago = {
        MontoPagado: capitalPorCuota + interesPorCuota,
        MontoInteresPagado: interesPorCuota,
        MontoCapitalAbonado: capitalPorCuota,
      };
    } else {
      return res.status(400).json({ error: "Tipo de cálculo no soportado" });
    }

    // 4. Transacción: actualizar préstamo, crear pago y registro en consolidación
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar préstamo
      const prestamoActualizado = await tx.prestamo.update({
        where: { IdPrestamo },
        data: {
          CapitalRestante:
            Number(prestamo.CapitalRestante) -
            datosDelPago.MontoCapitalAbonado,
          CuotasRestantes: prestamo.CuotasRestantes - 1,
          FechaUltimoPago: new Date(),
        },
      });

      // Crear pago
      const nuevoPago = await tx.pago.create({
        data: {
          IdPrestamo,
          FechaPago: new Date(),
          TipoPago,
          MontoPagado: datosDelPago.MontoPagado,
          NumeroCuota: prestamo.CantidadCuotas - prestamo.CuotasRestantes + 1,
          MontoInteresPagado: datosDelPago.MontoInteresPagado,
          MontoCapitalAbonado: datosDelPago.MontoCapitalAbonado,
          CuotasRestantes: prestamo.CuotasRestantes - 1,
          Observaciones: Observaciones || null,
        },
      });

      // Crear registro en consolidación (Ingreso)
      if (IdConsolidacion) {
        await tx.registroConsolidacion.create({
          data: {
            IdConsolidacion,
            FechaRegistro: new Date(),
            TipoRegistro: "Ingreso",
            Estado: "Confirmado",
            Descripcion: `Pago cuota #${nuevoPago.NumeroCuota} del préstamo ${IdPrestamo}`,
            Monto: datosDelPago.MontoPagado,
          },
        });
      }

      return { prestamoActualizado, nuevoPago };
    });

    res.status(201).json({
      success: true,
      message: "Pago registrado y consolidado exitosamente",
      pago: resultado.nuevoPago,
      prestamo: resultado.prestamoActualizado,
    });
  } catch (error) {
    console.error("Error creando pago:", error);
    res.status(500).json({ error: "Error creando pago", details: error });
  }
};

// Función auxiliar para calcular cuotas amortizables
const calcularCuotasAmortizable = (monto: number, tasaInteres: number, numeroCuotas: number) => {
  const cuotas: any[] = [];
  
  // Cálculo igual al que tienes en simularPrestamo
  let interes = Number(monto) * Number(tasaInteres) / 100;
  let laotraparte = 1 - Math.pow(1 + (Number(tasaInteres) / 100), numeroCuotas);
  let MontoCuota = ((Number(monto) * (Number(tasaInteres) / 100)) / -laotraparte) + interes;
  let capital = 0;
  let balance = Number(monto);

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
    
    interes = balance * Number(tasaInteres) / 100;
  }

  return cuotas;
};

// Función adicional para obtener información de la próxima cuota
export const getProximaCuota = async (req: Request, res: Response) => {
  try {
    const { IdPrestamo } = req.params;

    const prestamo = await prisma.prestamo.findUnique({
      where: { IdPrestamo: parseInt(IdPrestamo) },
      select: {
        IdPrestamo: true,
        MontoPrestado: true,
        TipoCalculo: true,
        InteresPorcentaje: true,
        CapitalRestante: true,
        CantidadCuotas: true,
        CuotasRestantes: true,
        Estado: true
      }
    });

    if (!prestamo) {
      return res.status(404).json({ error: "Préstamo no encontrado" });
    }

    if (prestamo.CuotasRestantes <= 0) {
      return res.status(200).json({ 
        message: "Préstamo completamente pagado",
        cuotasRestantes: 0 
      });
    }

    const cuotaActual = prestamo.CantidadCuotas - prestamo.CuotasRestantes + 1;
    
    let proximaCuota;

    if (prestamo.TipoCalculo?.toLowerCase() === "amortizable") {
      const cuotas = calcularCuotasAmortizable(
        Number(prestamo.MontoPrestado), 
        Number(prestamo.InteresPorcentaje), 
        prestamo.CantidadCuotas
      );
      proximaCuota = cuotas[cuotaActual - 1];
    } else {
      const interesPorCuota = Number(prestamo.MontoPrestado) * (Number(prestamo.InteresPorcentaje) / 100);
      const capitalPorCuota = Number(prestamo.MontoPrestado) / prestamo.CantidadCuotas;
      
      proximaCuota = {
        NumeroCuota: cuotaActual,
        cuota: capitalPorCuota + interesPorCuota,
        interesMonto: interesPorCuota,
        capital: capitalPorCuota,
        balance: Number(prestamo.CapitalRestante) - capitalPorCuota
      };
    }

    res.json({
      success: true,
      proximaCuota,
      cuotasRestantes: prestamo.CuotasRestantes,
      capitalRestante: prestamo.CapitalRestante
    });

  } catch (error) {
    console.error("Error obteniendo próxima cuota:", error);
    res.status(500).json({ error: "Error obteniendo información de cuota" });
  }
};

// Obtener todos los pagos
export const getAllPagos = async (req: Request, res: Response) => {
  try {
    const lista = await prisma.pago.findMany({
      include: { Prestamo: true, Volante: true },
    });
    res.json(lista);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo pagos", details: error });
  }
};

// Obtener un pago por ID
export const getPagoById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    const pago = await prisma.pago.findUnique({
      where: { IdPago: id },
      include: { Prestamo: true, Volante: true },
    });

    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    res.json(pago);
  } catch (error) {
    res.status(500).json({ error: "Error buscando pago", details: error });
  }
};

// Actualizar pago

export const updatePago = async (req: Request, res: Response) => {
  try {
    const { IdPago, TipoPago, Observaciones, MontoPagado } = req.body;

    if (!IdPago) return res.status(400).json({ error: "IdPago es requerido" });

    // 1. Obtener el pago y su préstamo asociado
    const pago = await prisma.pago.findUnique({
      where: { IdPago },
      include: { Prestamo: true },
    });

    if (!pago) return res.status(404).json({ error: "Pago no encontrado" });

    const prestamo = pago.Prestamo;

    if (!prestamo.TablaPagos)
      return res.status(400).json({ error: "El préstamo no tiene tabla de pagos" });

    // 2. Parsear la tabla de pagos
    let tablaPagos: any[] = JSON.parse(prestamo.TablaPagos);

    // 3. Encontrar la cuota que corresponde a este pago
    const cuotaIndex = tablaPagos.findIndex(
      (c) => c.NumeroCuota === pago.NumeroCuota
    );

    if (cuotaIndex === -1)
      return res.status(400).json({ error: "No se encontró la cuota en la tabla" });

    const cuota = tablaPagos[cuotaIndex];

    // 4. Calcular la diferencia si se actualiza MontoPagado
    const deltaCapital = MontoPagado
      ? MontoPagado - (cuota.MontoTotal || cuota.MontoCapital + cuota.MontoInteres)
      : 0;

    // 5. Actualizar los campos de la cuota
    cuota.MontoTotal = MontoPagado || cuota.MontoTotal;
    cuota.Estado = "Pagada"; // marcar como pagada
    cuota.Observaciones = Observaciones || cuota.Observaciones;

    tablaPagos[cuotaIndex] = cuota;

    // 6. Recalcular CapitalRestante y CuotasRestantes del préstamo
    const capitalPagado = tablaPagos
      .filter((c) => c.Estado === "Pagada")
      .reduce((sum, c) => sum + (c.MontoCapital || 0), 0);

    const cuotasPendientes = tablaPagos.filter((c) => c.Estado === "Pendiente")
      .length;

    // 7. Actualizar el pago y el préstamo en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      const pagoActualizado = await tx.pago.update({
        where: { IdPago },
        data: {
          TipoPago: TipoPago || pago.TipoPago,
          MontoPagado: cuota.MontoTotal,
          Observaciones: cuota.Observaciones,
        },
      });

      const prestamoActualizado = await tx.prestamo.update({
        where: { IdPrestamo: prestamo.IdPrestamo },
        data: {
          CapitalRestante: Number(prestamo.MontoPrestado) - capitalPagado,
          CuotasRestantes: cuotasPendientes,
          TablaPagos: JSON.stringify(tablaPagos),
        },
      });

      return { pagoActualizado, prestamoActualizado };
    });

    return res.json({
      success: true,
      pago: resultado.pagoActualizado,
      prestamo: resultado.prestamoActualizado,
    });
  } catch (error) {
    console.error("Error actualizando pago:", error);
    return res.status(500).json({ error: "Error actualizando pago", details: error });
  }
};



// Eliminar pago
export const deletePago = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  try {
    await prisma.pago.delete({ where: { IdPago: id } });
    res.json({ message: "Pago eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error eliminando pago", details: error });
  }
};
