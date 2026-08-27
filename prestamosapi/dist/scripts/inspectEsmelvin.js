"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function inspect() {
    const { data: cliente } = await supabase.from("Cliente").select("IdCliente, Nombre").ilike("Nombre", "%Esmelvin%");
    console.log("Clientes:", cliente);
    if (cliente && cliente.length > 0) {
        const { data: prestamo } = await supabase.from("Prestamo").select("*").eq("IdCliente", cliente[0].IdCliente);
        console.log("Prestamos:", prestamo);
    }
}
inspect();
