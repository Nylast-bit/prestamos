"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
// Corre todos los días a medianoche
node_cron_1.default.schedule("* */30 * * * *", () => {
    const today = new Date();
    const day = today.getDate();
    if (day === 8 || day === 23) {
        console.log(`✅ Consolidación detectada para el día ${day}.`);
    }
    else {
        console.log(`ℹ️ Hoy es ${day}, no toca consolidación.`);
    }
});
console.log("⏰ Job de consolidación inicializado (ejecuta a medianoche).");
