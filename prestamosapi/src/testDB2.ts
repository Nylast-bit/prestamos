import { supabase } from "./config/supabaseClient";

async function test() {
  const { data: prestamo, error } = await supabase
    .from("Prestamo")
    .select("IdPrestamo, TablaPagos")
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching prestamo:", error);
    return;
  }
  
  if (!prestamo) {
    console.error("No prestamo found");
    return;
  }

  console.log("TablaPagos:", prestamo.TablaPagos);
}

test();
