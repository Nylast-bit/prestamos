"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabaseClient_1 = require("./config/supabaseClient");
async function test() {
    const { data: prestamo, error } = await supabaseClient_1.supabase
        .from("Prestamo")
        .select("IdPrestamo, TablaPagos")
        .limit(1)
        .single();
    if (error) {
        console.error("Error fetching prestamo:", error);
        return;
    }
    if (!prestamo) {
        console.error("No prestamo found");
        return;
    }
    console.log("TablaPagos:", prestamo.TablaPagos);
}
test();
