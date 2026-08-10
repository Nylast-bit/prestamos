import { supabase } from "./config/supabaseClient";

async function test() {
  console.log("Fetching a client...");
  const { data: cliente, error } = await supabase
    .from("Cliente")
    .select("IdCliente, IdEmpresa, PuntajeCredito")
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching client:", error);
    return;
  }
  
  if (!cliente) {
    console.error("No client found");
    return;
  }

  console.log("Client found:", cliente);

  console.log("Trying to update score to 999...");
  const { data: updated, error: updateErr } = await supabase
    .from("Cliente")
    .update({ PuntajeCredito: 999, CategoriaRiesgo: "EXCELENTE" })
    .eq("IdCliente", cliente.IdCliente)
    .eq("IdEmpresa", cliente.IdEmpresa)
    .select();

  if (updateErr) {
    console.error("Update error:", updateErr);
  } else {
    console.log("Updated result:", updated);
  }
}

test();
