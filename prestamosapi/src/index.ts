// src/index.ts
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import express, { Request, Response } from 'express';
import prestamoRoutes from "./routes/prestamo.routes";
import clienteRoutes from "./routes/cliente.routes";
import prestatarioRoutes from "./routes/prestatario.routes";
import gastoFijoRoutes from "./routes/gastofijo.routes";
import consolidacioncapitalRoutes from "./routes/consolidacioncapital.routes";
import solicitudprestamoRoutes from "./routes/solicitudprestamo.routes";
import registroconsolidacionRoutes from "./routes/registroconsolidacion.routes";
import pagoRoutes from "./routes/pago.routes";
import authRoutes from "./routes/auth.routes";
import empresaRoutes from "./routes/empresa.routes";
import usuarioRoutes from "./routes/usuario.routes";
import pagopersonalizadoRoutes from "./routes/pagopersonalizado.routes";
import planRoutes from "./routes/plan.routes";
import suscripcionRoutes from "./routes/suscripcion.routes";
// 👇 importa el job
import { startCapitalJob } from "./jobs/capitalJob";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/prestamos", prestamoRoutes);
app.use("/api/prestatarios", prestatarioRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/gastosfijos", gastoFijoRoutes);
app.use("/api/consolidacioncapital", consolidacioncapitalRoutes);
app.use("/api/solicitudesprestamo", solicitudprestamoRoutes);
app.use("/api/registroconsolidacion", registroconsolidacionRoutes);
app.use("/api/pagos", pagoRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/empresas", empresaRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/pagospersonalizados", pagopersonalizadoRoutes);
app.use("/api/planes", planRoutes);
app.use("/api/suscripciones", suscripcionRoutes);

app.use(errorHandler);

//health check
app.get("/api/health", (req: Request, res: Response) => {
  res.send("Api is running");
});
app.listen(PORT, () => {
  console.log(`🚀 Server corriendo en http://localhost:${PORT}`);
  startCapitalJob();
  console.log("✅ Cron Job scheduler iniciado.");
});
