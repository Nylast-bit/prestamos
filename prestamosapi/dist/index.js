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
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Demasiadas peticiones desde esta dirección IP. Inténtelo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/auth/login", authLimiter);
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
app.use(errorHandler_1.errorHandler);
//health check
app.get("/api/health", (req, res) => {
    res.send("Api is running");
});
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 Server corriendo en http://localhost:${PORT}`);
    (0, capitalJob_1.startCapitalJob)();
    logger_1.logger.info("✅ Cron Job scheduler iniciado.");
});
