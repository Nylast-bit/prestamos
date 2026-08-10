import { supabase } from "./config/supabaseClient";

async function test() {
  const { data: logs } = await supabase.from('Cliente').select('IdCliente, Nombre, IdEmpresa, PuntajeCredito');
  console.log("All Clientes:", logs);
}
test();
