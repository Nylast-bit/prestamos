"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cliente_service_1 = require("./services/cliente.service");
async function test() {
    try {
        const clientes = await (0, cliente_service_1.getAllClientesService)(3); // Assuming Empresa 3 for Cliente 3? Let's check which empresa.
        console.log(clientes.find((c) => c.IdCliente === 3));
    }
    catch (e) {
        console.error(e);
    }
}
test();
