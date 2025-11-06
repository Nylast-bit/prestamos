"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_1 = require("./middlewares/errorHandler");
const routes_1 = __importDefault(require("./routes"));
const prestamo_routes_1 = __importDefault(require("./routes/prestamo.routes"));
const cliente_routes_1 = __importDefault(require("./routes/cliente.routes"));
const prestatario_routes_1 = __importDefault(require("./routes/prestatario.routes"));
const gastofijo_routes_1 = __importDefault(require("./routes/gastofijo.routes"));
const consolidacioncapital_routes_1 = __importDefault(require("./routes/consolidacioncapital.routes"));
const solicitudprestamo_routes_1 = __importDefault(require("./routes/solicitudprestamo.routes"));
const registroconsolidacion_routes_1 = __importDefault(require("./routes/registroconsolidacion.routes"));
const pago_routes_1 = __importDefault(require("./routes/pago.routes"));
// 👇 importa el job
require("./jobs/consolidacionJob");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api", routes_1.default);
app.use("/api/prestamos", prestamo_routes_1.default);
app.use("/api/prestatarios", prestatario_routes_1.default);
app.use("/api/clientes", cliente_routes_1.default);
app.use("/api/gastosfijos", gastofijo_routes_1.default);
app.use("/api/consolidacioncapital", consolidacioncapital_routes_1.default);
app.use("/api/solicitudesprestamo", solicitudprestamo_routes_1.default);
app.use("/api/registroconsolidacion", registroconsolidacion_routes_1.default);
app.use("/api/pagos", pago_routes_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server corriendo en http://localhost:${PORT}`);
});
