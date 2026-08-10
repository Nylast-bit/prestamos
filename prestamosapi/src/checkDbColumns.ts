import { supabase } from "./config/supabaseClient";

async function test() {
  const { data } = await supabase.from('Cliente').select('*').eq('IdCliente', 3).single();
  console.log("Cliente 3 full data:", data);
}
test();
