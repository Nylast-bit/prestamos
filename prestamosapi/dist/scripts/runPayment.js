"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pagopersonalizado_service_1 = require("../services/pagopersonalizado.service");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function run() {
    try {
        const result = await (0, pagopersonalizado_service_1.createPagoPersonalizadoService)({
            idPrestamo: 30,
            idConsolidacion: 10, // Active consolidacion
            montoPagado: 1870,
            fechaPago: new Date().toISOString(),
            concepto: "Pago Personalizado",
            esLiquidacion: false,
            esAbonoExtraordinario: false
        });
        console.log("Success:", result);
    }
    catch (error) {
        console.error("Error:", error);
    }
}
run();
