// src/controllers/prestamo.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import * as prestamoService from "../services/prestamo.service";
import { any } from "zod";


interface SimulacionInput {
  monto: number;
  tasaInteres: number;
  numeroCuotas: number;
  tipoCalculo: string;
}


// Obtener todos los préstamos
export const getPrestamos = asyncHandler(async (req: Request, res: Response) => {
  const prestamos = await prestamoService.getPrestamosService();
  res.json(prestamos);
});

// Obtener un préstamo por ID
export const getPrestamoById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const prestamo = await prestamoService.getPrestamoByIdService(Number(id));
  res.json(prestamo);
});

// Crear préstamo
export const createPrestamo = asyncHandler(async (req: Request, res: Response) => {
  const nuevoPrestamo = await prestamoService.createPrestamoService(req.body);
  res.status(201).json({
    success: true,
    prestamo: nuevoPrestamo,
  });
});

// Actualizar préstamo
export const updatePrestamo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const prestamo = await prestamoService.updatePrestamoService(Number(id), data);
  res.json(prestamo);
});

// Eliminar préstamo
export const deletePrestamo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const idPrestamo = Number(id);
  const resultado = await prestamoService.deletePrestamoService(idPrestamo);

  res.json({
    success: true,
    message: "Préstamo eliminado correctamente.",
    resultado: resultado
  });
});





// Función adicional para obtener información antes de eliminar
export const getPrestamoParaEliminar = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const idPrestamo = Number(id);

  
  // 1. Llamamos al servicio para obtener los datos crudos
  // El 'try/catch' ya no es necesario aquí, 'asyncHandler' lo hace
  const prestamo = await prestamoService.getPrestamoConDetallesService(idPrestamo);

  
  // 2. El controlador se encarga de 'dar formato' a la respuesta
  res.json({
    success: true,
    // El controlador formatea los datos del préstamo
    prestamo: {
      id: prestamo.IdPrestamo,
      cliente: prestamo.Cliente[0].Nombre,
      prestatario: prestamo.Prestatario[0].Nombre, 
      monto: prestamo.MontoPrestado,
      estado: prestamo.Estado
    },
    // El controlador hace los cálculos de '.length'
    registrosRelacionados: {
      pagos: prestamo.Pagos.length,
      acuerdos: prestamo.Acuerdos.length,
      pagosPersonalizados: prestamo.PagosPersonalizados.length,
      volantes: prestamo.Volantes.length
    },
    // El controlador organiza los detalles
    detalles: {
      pagos: prestamo.Pagos,
      acuerdos: prestamo.Acuerdos,
      pagosPersonalizados: prestamo.PagosPersonalizados.length, // (Pequeño bug en tu código original, quizás querías el array?)
      volantes: prestamo.Volantes.length // (Igual aquí)
    },
    // El controlador añade la advertencia estática
    advertencia: "Al eliminar este préstamo se eliminarán TODOS los registros relacionados de forma permanente."
  });
});


// Simular préstamo
export const simularPrestamo = async (req: Request, res: Response) => {
  try {
    const { monto, tasaInteres, numeroCuotas, tipoCalculo } = req.body;

    // 1. El controlador hace la validación de entrada
    if (!monto || !tasaInteres || !numeroCuotas || !tipoCalculo) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // 2. El controlador llama al servicio con los datos limpios
    // Nota: Esta llamada ya NO es 'async'
    const simulacion = prestamoService.simularPrestamoService({
      monto,
      tasaInteres,
      numeroCuotas,
      tipoCalculo,
    });

    // 3. El controlador envía la respuesta
    return res.json({
      success: true,
      ...simulacion, // El objeto que devolvió el servicio
    });
    
  } catch (error: any) {
    console.error(error);
    
    // 4. Atrapamos el error que 'lanzó' el servicio
    if (error.message === "Tipo de cálculo no soportado") {
      return res.status(400).json({ error: error.message });
    }
    
    // Cualquier otro error inesperado
    return res.status(500).json({ error: "Error en simulación", details: error.message });
  }
};

//opciones prestamo
export const opcionesSimularPrestamoCapitalInteres = async (
  req: Request,
  res: Response
) => {
  try {
    const { monto, tasaInteres, numeroCuotas } = req.body;

    // 1. El controlador valida la entrada
    if (!monto || !tasaInteres || !numeroCuotas) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // 2. El controlador llama al servicio (no es async)
    const prestamos = prestamoService.opcionesSimularPrestamoService({
      monto,
      tasaInteres,
      numeroCuotas,
    });

    // 3. El controlador envía la respuesta
    return res.json({
      success: true,
      prestamos, // El array que devolvió el servicio
    });
    
  } catch (error: any) {
    console.error(error);
    
    // 4. Atrapamos el error de lógica de negocio (el que añadimos)
    if (error.message.includes("El número de cuotas debe ser mayor a 2")) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: "Error en simulación", details: error.message });
  }
};

//Recalcular el interés del prestamo para ajustar el monto de cuotas
export const calcularTasaPorCuota = async (req: Request, res: Response) => {
  try {
    // 1. El controlador valida la entrada
    const { monto, cuotaDeseada, numeroCuotas, tipoCalculo } = req.body;

    if (!monto || !cuotaDeseada || !numeroCuotas || !tipoCalculo) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // 2. El controlador llama al servicio (no es async)
    const resultadoCalculo = prestamoService.calcularTasaPorCuotaService({
      monto,
      cuotaDeseada,
      numeroCuotas,
      tipoCalculo,
    });

    // 3. El controlador envía la respuesta
    return res.json({
      success: true,
      ...resultadoCalculo, // El objeto que devolvió el servicio
    });
    
  } catch (error: any) {
    console.error(error);
    
    // 4. Atrapamos los errores de lógica de negocio
    if (error.message.includes("No se pudo encontrar una tasa válida")) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes("Tipo de cálculo no soportado")) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({
      error: "Error en el cálculo de tasa",
      details: error.message
    });
  }
};

// Función auxiliar para validar que la cuota deseada sea razonable


// Endpoint adicional para obtener el rango válido de cuotas
export const obtenerRangoCuotas = async (req: Request, res: Response) => {
  try {
    // 1. El controlador valida la entrada
    const { monto, numeroCuotas } = req.body;

    if (!monto || !numeroCuotas) {
      return res.status(400).json({ error: "Faltan parámetros" });
    }

    // 2. El controlador llama al servicio (no es async)
    const rango = prestamoService.obtenerRangoCuotasService({
      monto,
      numeroCuotas,
    });

    // 3. El controlador envía la respuesta (añade el mensaje estático)
    return res.json({
      success: true,
      ...rango, // { cuotaMinima, cuotaMaximaSugerida }
      mensaje: "La cuota mínima cubre solo el capital. La cuota máxima sugerida es el doble para mantener tasas razonables."
    });

  } catch (error: any) {
    console.error(error);
    
    // 4. Atrapamos el error de lógica de negocio (división por cero)
    if (error.message.includes("El número de cuotas debe ser un valor positivo")) {
        return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ 
      error: "Error al calcular rango de cuotas",
      details: error.message 
    });
  }
};


        