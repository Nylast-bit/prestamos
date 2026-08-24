import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  const { data: cliente } = await supabase.from("Cliente").select("IdCliente, Nombre").ilike("Nombre", "%Esmelvin%");
  console.log("Clientes:", cliente);

  if (cliente && cliente.length > 0) {
    const { data: prestamo } = await supabase.from("Prestamo").select("*").eq("IdCliente", cliente[0].IdCliente);
    console.log("Prestamos:", prestamo);
  }
}
inspect();
