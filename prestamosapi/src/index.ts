// src/index.ts
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import express, { Request, Response } from 'express';
import routes from "./routes";
import prestamoRoutes from "./routes/prestamo.routes";
import clienteRoutes from "./routes/cliente.routes";
import prestatarioRoutes from "./routes/prestatario.routes";
import gastoFijoRoutes from "./routes/gastofijo.routes";
import consolidacioncapitalRoutes from "./routes/consolidacioncapital.routes";
import solicitudprestamoRoutes from "./routes/solicitudprestamo.routes";  
import registroconsolidacionRoutes from "./routes/registroconsolidacion.routes";
import pagoRoutes from "./routes/pago.routes";

// 👇 importa el job
import "./jobs/capitalJob";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api", routes);
app.use("/api/prestamos", prestamoRoutes);
app.use("/api/prestatarios", prestatarioRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/gastosfijos", gastoFijoRoutes);
app.use("/api/consolidacioncapital", consolidacioncapitalRoutes);
app.use("/api/solicitudesprestamo", solicitudprestamoRoutes);
app.use("/api/registroconsolidacion", registroconsolidacionRoutes);
app.use("/api/pagos", pagoRoutes);

app.use(errorHandler);

//health check
app.get("/api/health", (req: Request, res: Response) => {
  res.send("Api is running");
});
app.listen(PORT, () => {
  console.log(`🚀 Server corriendo en http://localhost:${PORT}`);
});
