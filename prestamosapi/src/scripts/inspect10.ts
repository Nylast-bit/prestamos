import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: prestamo } = await supabase.from("Prestamo").select("*").eq("IdPrestamo", 10);
  console.log("Prestamo 10:", prestamo);
  
  if (prestamo && prestamo.length > 0) {
      const { data: pagos } = await supabase.from("Pago").select("*").eq("IdPrestamo", 10);
      console.log("Pagos:", pagos);
  }
}
inspect();
