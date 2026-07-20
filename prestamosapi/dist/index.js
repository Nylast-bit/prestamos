"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
// src/index.ts
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const errorHandler_1 = require("./middlewares/errorHandler");
const express_1 = __importDefault(require("express"));
const prestamo_routes_1 = __importDefault(require("./routes/prestamo.routes"));
const cliente_routes_1 = __importDefault(require("./routes/cliente.routes"));
const prestatario_routes_1 = __importDefault(require("./routes/prestatario.routes"));
const gastofijo_routes_1 = __importDefault(require("./routes/gastofijo.routes"));
const consolidacioncapital_routes_1 = __importDefault(require("./routes/consolidacioncapital.routes"));
const solicitudprestamo_routes_1 = __importDefault(require("./routes/solicitudprestamo.routes"));
const registroconsolidacion_routes_1 = __importDefault(require("./routes/registroconsolidacion.routes"));
const pago_routes_1 = __importDefault(require("./routes/pago.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const empresa_routes_1 = __importDefault(require("./routes/empresa.routes"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const pagopersonalizado_routes_1 = __importDefault(require("./routes/pagopersonalizado.routes"));
const plan_routes_1 = __importDefault(require("./routes/plan.routes"));
const suscripcion_routes_1 = __importDefault(require("./routes/suscripcion.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
// 👇 importa el job
const capitalJob_1 = require("./jobs/capitalJob");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// 1. Confianza en proxies (Debe ir antes de inicializar los limiters)
app.set('trust proxy', 1);
// 2. Definición de Rate Limiters
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Demasiadas peticiones desde esta dirección IP. Inténtelo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de peticiones
});
const allowedOrigins = [
    'https://prestamos.easywagps.com',
    'https://prestamos-nu.vercel.app',
    'http://localhost:3000'
];
// 3. Middlewares de Seguridad HTTP y CORS
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false,
}));
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Si no hay origen (como Postman), permitimos la petición
        if (!origin)
            return callback(null, true);
        // Removemos cualquier barra diagonal al final del string del origen para evitar conflictos
        const cleanedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        if (allowedOrigins.includes(cleanedOrigin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Bloqueado por políticas de CORS'));
        }
    },
    credentials: true,
    // Le decimos al navegador exactamente qué métodos y cabeceras aceptamos en la petición "preflight"
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));
// 4. Middlewares de Parseo de Body (Lectura de datos)
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 5. Aplicación de Rate Limiters Globales y Específicos
app.use(limiter);
app.use("/api/auth/login", authLimiter);
// 6. Rutas Base y Health Check (Deben ir ANTES del manejador de errores)
app.get("/api/health", (req, res) => {
    res.send("Api is running");
});
// 7. Rutas del Negocio
app.use("/api/prestamos", prestamo_routes_1.default);
app.use("/api/prestatarios", prestatario_routes_1.default);
app.use("/api/clientes", cliente_routes_1.default);
app.use("/api/gastosfijos", gastofijo_routes_1.default);
app.use("/api/consolidacioncapital", consolidacioncapital_routes_1.default);
app.use("/api/solicitudesprestamo", solicitudprestamo_routes_1.default);
app.use("/api/registroconsolidacion", registroconsolidacion_routes_1.default);
app.use("/api/pagos", pago_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/empresas", empresa_routes_1.default);
app.use("/api/usuarios", usuario_routes_1.default);
app.use("/api/pagospersonalizados", pagopersonalizado_routes_1.default);
app.use("/api/planes", plan_routes_1.default);
app.use("/api/suscripciones", suscripcion_routes_1.default);
app.use("/api/import", import_routes_1.default);
// 8. Manejo Global de Errores (Debe ser SIEMPRE el último middleware)
app.use(errorHandler_1.errorHandler);
// 9. Inicialización del Servidor
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 Server corriendo en http://localhost:${PORT}`);
    (0, capitalJob_1.startCapitalJob)();
    logger_1.logger.info("✅ Cron Job scheduler iniciado.");
});
