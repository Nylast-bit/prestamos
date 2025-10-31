/*
  Warnings:

  - You are about to drop the column `Ajustable` on the `Prestamo` table. All the data in the column will be lost.
  - Added the required column `NumeroCuota` to the `Pago` table without a default value. This is not possible if the table is not empty.
  - Added the required column `CapitalRestante` to the `Prestamo` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pago" (
    "IdPago" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdPrestamo" INTEGER NOT NULL,
    "FechaPago" DATETIME NOT NULL,
    "TipoPago" TEXT NOT NULL,
    "MontoPagado" DECIMAL NOT NULL,
    "MontoInteresPagado" DECIMAL NOT NULL,
    "MontoCapitalAbonado" DECIMAL NOT NULL,
    "CuotasRestantes" INTEGER NOT NULL,
    "Observaciones" TEXT,
    "NumeroCuota" INTEGER NOT NULL,
    CONSTRAINT "Pago_IdPrestamo_fkey" FOREIGN KEY ("IdPrestamo") REFERENCES "Prestamo" ("IdPrestamo") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Pago" ("CuotasRestantes", "FechaPago", "IdPago", "IdPrestamo", "MontoCapitalAbonado", "MontoInteresPagado", "MontoPagado", "Observaciones", "TipoPago") SELECT "CuotasRestantes", "FechaPago", "IdPago", "IdPrestamo", "MontoCapitalAbonado", "MontoInteresPagado", "MontoPagado", "Observaciones", "TipoPago" FROM "Pago";
DROP TABLE "Pago";
ALTER TABLE "new_Pago" RENAME TO "Pago";
CREATE TABLE "new_Prestamo" (
    "IdPrestamo" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdCliente" INTEGER NOT NULL,
    "IdPrestatario" INTEGER NOT NULL,
    "MontoPrestado" DECIMAL NOT NULL,
    "TipoCalculo" TEXT NOT NULL,
    "InteresPorcentaje" DECIMAL NOT NULL,
    "InteresMontoTotal" DECIMAL NOT NULL,
    "CapitalRestante" DECIMAL NOT NULL,
    "CapitalTotalPagar" DECIMAL NOT NULL,
    "MontoCuota" DECIMAL NOT NULL,
    "CantidadCuotas" INTEGER NOT NULL,
    "CuotasRestantes" INTEGER NOT NULL,
    "ModalidadPago" TEXT NOT NULL,
    "FechaInicio" DATETIME NOT NULL,
    "FechaFinEstimada" DATETIME NOT NULL,
    "FechaUltimoPago" DATETIME,
    "Estado" TEXT NOT NULL,
    "TablaPagos" TEXT,
    "Observaciones" TEXT,
    CONSTRAINT "Prestamo_IdPrestatario_fkey" FOREIGN KEY ("IdPrestatario") REFERENCES "Prestatario" ("IdPrestatario") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Prestamo_IdCliente_fkey" FOREIGN KEY ("IdCliente") REFERENCES "Cliente" ("IdCliente") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Prestamo" ("CantidadCuotas", "CapitalTotalPagar", "CuotasRestantes", "Estado", "FechaFinEstimada", "FechaInicio", "FechaUltimoPago", "IdCliente", "IdPrestamo", "IdPrestatario", "InteresMontoTotal", "InteresPorcentaje", "ModalidadPago", "MontoCuota", "MontoPrestado", "Observaciones", "TipoCalculo") SELECT "CantidadCuotas", "CapitalTotalPagar", "CuotasRestantes", "Estado", "FechaFinEstimada", "FechaInicio", "FechaUltimoPago", "IdCliente", "IdPrestamo", "IdPrestatario", "InteresMontoTotal", "InteresPorcentaje", "ModalidadPago", "MontoCuota", "MontoPrestado", "Observaciones", "TipoCalculo" FROM "Prestamo";
DROP TABLE "Prestamo";
ALTER TABLE "new_Prestamo" RENAME TO "Prestamo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
