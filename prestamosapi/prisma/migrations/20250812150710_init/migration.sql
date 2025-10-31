-- CreateTable
CREATE TABLE "Cliente" (
    "IdCliente" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Nombre" TEXT NOT NULL,
    "Cedula" TEXT,
    "Telefono" TEXT,
    "Email" TEXT,
    "Direccion" TEXT,
    "FechaRegistro" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Prestatario" (
    "IdPrestatario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Nombre" TEXT NOT NULL,
    "Contacto" TEXT,
    "Telefono" TEXT,
    "Email" TEXT,
    "Clave" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Prestamo" (
    "IdPrestamo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdCliente" INTEGER NOT NULL,
    "IdPrestatario" INTEGER NOT NULL,
    "MontoPrestado" DECIMAL NOT NULL,
    "TipoCalculo" TEXT NOT NULL,
    "InteresPorcentaje" DECIMAL NOT NULL,
    "InteresMontoTotal" DECIMAL NOT NULL,
    "CapitalTotalPagar" DECIMAL NOT NULL,
    "MontoCuota" DECIMAL NOT NULL,
    "CantidadCuotas" INTEGER NOT NULL,
    "CuotasRestantes" INTEGER NOT NULL,
    "ModalidadPago" TEXT NOT NULL,
    "FechaInicio" DATETIME NOT NULL,
    "FechaFinEstimada" DATETIME NOT NULL,
    "FechaUltimoPago" DATETIME,
    "Estado" TEXT NOT NULL,
    "Ajustable" BOOLEAN,
    "Observaciones" TEXT,
    CONSTRAINT "Prestamo_IdCliente_fkey" FOREIGN KEY ("IdCliente") REFERENCES "Cliente" ("IdCliente") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prestamo_IdPrestatario_fkey" FOREIGN KEY ("IdPrestatario") REFERENCES "Prestatario" ("IdPrestatario") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "IdPago" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdPrestamo" INTEGER NOT NULL,
    "FechaPago" DATETIME NOT NULL,
    "TipoPago" TEXT NOT NULL,
    "MontoPagado" DECIMAL NOT NULL,
    "MontoInteresPagado" DECIMAL NOT NULL,
    "MontoCapitalAbonado" DECIMAL NOT NULL,
    "CuotasRestantes" INTEGER NOT NULL,
    "Observaciones" TEXT,
    CONSTRAINT "Pago_IdPrestamo_fkey" FOREIGN KEY ("IdPrestamo") REFERENCES "Prestamo" ("IdPrestamo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PagoPersonalizado" (
    "IdPagoPersonalizado" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdPrestamo" INTEGER NOT NULL,
    "DiaPago" INTEGER,
    "DiaPago2" INTEGER,
    "SemanaDia" TEXT,
    CONSTRAINT "PagoPersonalizado_IdPrestamo_fkey" FOREIGN KEY ("IdPrestamo") REFERENCES "Prestamo" ("IdPrestamo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AcuerdoPrestamo" (
    "IdAcuerdo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdPrestamo" INTEGER NOT NULL,
    "FechaAcuerdo" DATETIME NOT NULL,
    "MontoSaldado" DECIMAL NOT NULL,
    "Observaciones" TEXT,
    CONSTRAINT "AcuerdoPrestamo_IdPrestamo_fkey" FOREIGN KEY ("IdPrestamo") REFERENCES "Prestamo" ("IdPrestamo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SolicitudPrestamo" (
    "IdSolicitud" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdCliente" INTEGER NOT NULL,
    "MontoSolicitado" DECIMAL NOT NULL,
    "FechaDeseada" DATETIME NOT NULL,
    "Estado" TEXT NOT NULL,
    "Notas" TEXT,
    "FechaCreacion" DATETIME NOT NULL,
    CONSTRAINT "SolicitudPrestamo_IdCliente_fkey" FOREIGN KEY ("IdCliente") REFERENCES "Cliente" ("IdCliente") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GastoFijo" (
    "IdGasto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Nombre" TEXT NOT NULL,
    "Monto" DECIMAL NOT NULL,
    "Frecuencia" TEXT NOT NULL,
    "Dia1" INTEGER NOT NULL,
    "Dia2" INTEGER,
    "Activo" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "DebitoExtra" (
    "IdDebito" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Fecha" DATETIME NOT NULL,
    "Descripcion" TEXT NOT NULL,
    "Monto" DECIMAL NOT NULL,
    "QuincenaInicio" DATETIME NOT NULL,
    "QuincenaFin" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConsolidacionCapital" (
    "IdConsolidacion" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "FechaInicio" DATETIME,
    "FechaFin" DATETIME,
    "CapitalEntrante" DECIMAL NOT NULL,
    "CapitalSaliente" DECIMAL NOT NULL,
    "Observaciones" TEXT,
    "FechaGeneracion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RegistroConsolidacion" (
    "IdRegistro" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdConsolidacion" INTEGER NOT NULL,
    "FechaRegistro" DATETIME NOT NULL,
    "TipoRegistro" TEXT NOT NULL,
    "Estado" TEXT NOT NULL,
    "Descripcion" TEXT NOT NULL,
    "Monto" DECIMAL NOT NULL,
    CONSTRAINT "RegistroConsolidacion_IdConsolidacion_fkey" FOREIGN KEY ("IdConsolidacion") REFERENCES "ConsolidacionCapital" ("IdConsolidacion") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Volante" (
    "IdVolante" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdPrestamo" INTEGER NOT NULL,
    "TipoVolante" TEXT NOT NULL,
    "FechaGeneracion" DATETIME NOT NULL,
    CONSTRAINT "Volante_IdPrestamo_fkey" FOREIGN KEY ("IdPrestamo") REFERENCES "Prestamo" ("IdPrestamo") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_Cedula_key" ON "Cliente"("Cedula");
