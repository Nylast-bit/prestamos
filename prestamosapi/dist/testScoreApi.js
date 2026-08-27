"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const score_service_1 = require("./services/score.service");
async function test() {
    try {
        const data = await (0, score_service_1.getScoreService)("3", 3); // IdCliente: 3, IdEmpresa: 3
        console.log("Score Service Data:", data);
    }
    catch (e) {
        console.error(e);
    }
}
test();
