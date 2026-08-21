import { createPagoPersonalizadoService } from "../services/pagopersonalizado.service";
import dotenv from "dotenv";
dotenv.config();

async function run() {
  try {
    const result = await createPagoPersonalizadoService({
      idPrestamo: 30,
      idConsolidacion: 10, // Active consolidacion
      montoPagado: 1870,
      fechaPago: new Date().toISOString(),
      concepto: "Pago Personalizado",
      esLiquidacion: false,
      esAbonoExtraordinario: false
    });
    console.log("Success:", result);
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
