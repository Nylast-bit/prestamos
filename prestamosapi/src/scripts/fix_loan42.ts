import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: prestamo } = await supabase.from("Prestamo").select("*").eq("IdPrestamo", 42).single();
  if (!prestamo) return console.error("No prestamo");

  let tabla = JSON.parse(prestamo.TablaPagos);
  
  // Agregar cuota 2
  tabla.push({
      numeroCuota: 2,
      cuota: 1100, // 900 + 200
      interes: 200,
      capital: 900,
      saldo: 0,
      pagado: false
  });

  const updatePayload = {
      Estado: "Activo",
      CapitalRestante: 900,
      CantidadCuotas: 2, // Se agregó una
      CuotasRestantes: 1,
      TablaPagos: JSON.stringify(tabla)
  };

  const { error } = await supabase.from("Prestamo").update(updatePayload).eq("IdPrestamo", 42);
  
  if (error) {
      console.error("Error al actualizar:", error);
  } else {
      console.log("Préstamo 42 arreglado con éxito. Cuotas restantes: 1, Saldo: 900");
  }
}
fix();
