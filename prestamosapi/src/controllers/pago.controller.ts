import { Request, Response } from "express";
// Importamos TODOS los servicios
import { 
  createPagoService, 
  getAllPagosService, 
  getPagoByIdService, 
  getProximaCuotaService, 
  updatePagoService, 
  deletePagoService,
  getHistorialPagosService
} from "../services/pago.service"; 
// NOTA: Asegúrate que la ruta al service sea correcta (../services/pagos.service o ../services/pago.service)

// 1. CREAR PAGO (Ya lo tenías, pero asegúrate que esté exportado)
export const createPago = async (req: Request, res: Response) => {
  try {
    // 1. Recibimos los nuevos parámetros del Frontend
    const { 
        IdPrestamo, 
        MontoPagado, 
        TipoPago, 
        Observaciones, 
        MontoInteresPagado,   // <--- NUEVO
        MontoCapitalAbonado,  // <--- NUEVO
        NumeroCuota           // <--- NUEVO
    } = req.body;

    if (!IdPrestamo || !TipoPago || !MontoPagado) {
        return res.status(400).json({ error: "Datos incompletos." });
    }

    const resultado = await createPagoService({
      IdPrestamo: Number(IdPrestamo),
      MontoPagado: Number(MontoPagado),
      TipoPago,
      Observaciones,
      // Pasamos los datos al servicio
      MontoInteresPagado: Number(MontoInteresPagado), 
      MontoCapitalAbonado: Number(MontoCapitalAbonado),
      NumeroCuota: Number(NumeroCuota)
    });

    res.status(201).json({
      success: true,
      message: "Pago registrado exitosamente.",
      data: resultado
    });

  } catch (error: any) {
    console.error("Error en createPago:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. OBTENER TODOS (Faltaba este export)
export const getAllPagos = async (req: Request, res: Response) => {
  try {
    const pagos = await getAllPagosService();
    res.json(pagos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. OBTENER POR ID (Faltaba este export)
export const getPagoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pago = await getPagoByIdService(Number(id));
    res.json(pago);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. OBTENER PRÓXIMA CUOTA (Faltaba este export)
export const getProximaCuota = async (req: Request, res: Response) => {
  try {
    const { IdPrestamo } = req.params; // Viene de la URL /proxima-cuota/:IdPrestamo
    const info = await getProximaCuotaService(Number(IdPrestamo));
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. ACTUALIZAR PAGO (Faltaba este export)
export const updatePago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const pago = await updatePagoService(Number(id), data);
    res.json(pago);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. ELIMINAR PAGO (Faltaba este export)
export const deletePago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deletePagoService(Number(id));
    res.json({ message: "Pago eliminado correctamente" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getHistorialPagos = async (req: Request, res: Response) => {
    try {
        // 1. Extraemos el idPrestamo de los parámetros de la URL
        // Por ejemplo: /pagos/historial/123 -> id = 123
        const { id } = req.params;

        // 2. Validación simple
        if (!id) {
            return res.status(400).json({ error: "El ID del préstamo es obligatorio" });
        }

        // 3. Llamamos al servicio (convertimos el id a Number porque viene como string)
        const historial = await getHistorialPagosService(Number(id));

        // 4. Respondemos con éxito
        return res.status(200).json(historial);

    } catch (error: any) {
        console.error("Error en getHistorialPagosController:", error);
        return res.status(500).json({ error: error.message || "Error interno del servidor" });
    }
};