"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabaseClient_1 = require("./config/supabaseClient");
async function test() {
    const { data: logs } = await supabaseClient_1.supabase.from('Cliente').select('IdCliente, Nombre, IdEmpresa, PuntajeCredito');
    console.log("All Clientes:", logs);
}
test();
