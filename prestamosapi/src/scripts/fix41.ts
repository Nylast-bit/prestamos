import { simularPrestamoService } from "../services/prestamo.service";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const idPrestamo = 41;
  const monto = 10000;
  const tasaInteres = 10;
  const cuotas = 2;
  const tipoCalculo = "solo_interes";

  console.log("Generando nueva simulación para Préstamo 41...");

  const simulacion = simularPrestamoService({
    monto,
    tasaInteres,
    numeroCuotas: cuotas,
    tipoCalculo
  });

  console.log("Simulación:", simulacion);

  const updatePayload = {
    TipoCalculo: tipoCalculo,
    InteresPorcentaje: tasaInteres,
    InteresMontoTotal: simulacion.montoTotalInteres,
    CapitalTotalPagar: simulacion.montoTotalAPagar,
    MontoCuota: simulacion.montoCuota,
    CantidadCuotas: cuotas,
    CuotasRestantes: cuotas,
    TablaPagos: JSON.stringify(simulacion.tablaAmortizacion)
  };

  const { error } = await supabase.from("Prestamo").update(updatePayload).eq("IdPrestamo", idPrestamo);
  
  if (error) {
    console.error("Error actualizando:", error);
  } else {
    console.log("✅ Préstamo 41 actualizado exitosamente a Solo Interés.");
  }
}
fix();
