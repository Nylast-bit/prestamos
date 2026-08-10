import { getAllClientesService } from "./services/cliente.service";

async function test() {
  try {
    const clientes = await getAllClientesService(3); // Assuming Empresa 3 for Cliente 3? Let's check which empresa.
    console.log(clientes.find((c: any) => c.IdCliente === 3));
  } catch(e) {
    console.error(e);
  }
}
test();
