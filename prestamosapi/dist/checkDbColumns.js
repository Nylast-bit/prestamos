"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabaseClient_1 = require("./config/supabaseClient");
async function test() {
    const { data } = await supabaseClient_1.supabase.from('Cliente').select('*').eq('IdCliente', 3).single();
    console.log("Cliente 3 full data:", data);
}
test();
