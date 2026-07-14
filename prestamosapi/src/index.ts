import { logger } from './utils/logger';
// src/index.ts
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
import importRoutes from "./routes/import.routes";
// 👇 importa el job
import { startCapitalJob } from "./jobs/capitalJob";

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Confianza en proxies (Debe ir antes de inicializar los limiters)
app.set('trust proxy', 1);

// 2. Definición de Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Demasiadas peticiones desde esta dirección IP. Inténtelo más tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de peticiones
});

// 3. Middlewares de Seguridad HTTP y CORS
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true 
}));

// 4. Middlewares de Parseo de Body (Lectura de datos)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Aplicación de Rate Limiters Globales y Específicos
app.use(limiter);
app.use("/api/auth/login", authLimiter);

// 6. Rutas Base y Health Check (Deben ir ANTES del manejador de errores)
app.get("/api/health", (req: Request, res: Response) => {
  res.send("Api is running");
});

// 7. Rutas del Negocio
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
app.use("/api/import", importRoutes);

// 8. Manejo Global de Errores (Debe ser SIEMPRE el último middleware)
app.use(errorHandler);

// 9. Inicialización del Servidor
app.listen(PORT, () => {
  logger.info(`🚀 Server corriendo en http://localhost:${PORT}`);
  startCapitalJob();
  logger.info("✅ Cron Job scheduler iniciado.");
});