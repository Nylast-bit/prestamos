"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const score_service_1 = require("./config/../services/score.service");
async function test() {
    console.log("Recalculating score for client 14, empresa 1...");
    try {
        const res = await (0, score_service_1.recalcularScoreService)("14", 1);
        console.log("Recalculation result:", res);
    }
    catch (e) {
        console.error("Error:", e);
    }
}
test();
