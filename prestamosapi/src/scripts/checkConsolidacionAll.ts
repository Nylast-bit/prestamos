import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConsolidacionAll() {
  console.log("Checking all RegistroConsolidacion for 1870...");

  const { data: registros } = await supabase
    .from("RegistroConsolidacion")
    .select("*")
    .eq("Monto", 1870);

  console.log("Registros de 1870:", registros);

  if (registros && registros.length > 0) {
      for (const r of registros) {
          console.log(`Deleting orphaned RegistroConsolidacion ID: ${r.IdRegistro}`);
          await supabase.from("RegistroConsolidacion").delete().eq("IdRegistro", r.IdRegistro);
      }
  }
}
checkConsolidacionAll();
