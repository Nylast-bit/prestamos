import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: prestamo } = await supabase.from("Prestamo").select("*").eq("IdPrestamo", 42).single();
  console.log("Prestamo:", prestamo);

  const { data: cliente } = await supabase.from("Cliente").select("Nombre").eq("IdCliente", prestamo?.IdCliente).single();
  console.log("Cliente:", cliente);
}
inspect();
