import { supabase } from '../config/supabaseClient';

async function main() {
  console.log("🔍 Investigando Empresa ID 3...");

  const { data: empresa } = await supabase
    .from("Empresa")
    .select("*")
    .eq("IdEmpresa", 3)
    .maybeSingle();

  console.log("Empresa 3:", empresa);

  const { data: clientes } = await supabase
    .from("Cliente")
    .select("IdCliente, Nombre, Telefono, Email, IdEmpresa")
    .eq("IdEmpresa", 3);

  console.log("\nClientes en Empresa 3:", clientes);

  const { data: prestamistas } = await supabase
    .from("Prestatario")
    .select("IdPrestatario, Nombre, Telefono, Email, IdEmpresa")
    .eq("IdEmpresa", 3);

  console.log("\nPrestamistas en Empresa 3:", prestamistas);

  const { data: prestamos } = await supabase
    .from("Prestamo")
    .select("IdPrestamo, NumeroEmpresa, MontoPrestado, CapitalRestante, InteresPorcentaje, TipoCalculo, MontoCuota, Estado, IdCliente, IdPrestatario")
    .eq("IdEmpresa", 3);

  console.log("\nPréstamos en Empresa 3:", prestamos);
}

main().catch(console.error);
