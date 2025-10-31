/*
  Warnings:

  - You are about to drop the `DebitoExtra` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `Contacto` on the `Prestatario` table. All the data in the column will be lost.
  - Added the required column `IdGasto` to the `ConsolidacionCapital` table without a default value. This is not possible if the table is not empty.
  - Added the required column `IdPago` to the `Volante` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "DebitoExtra";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cliente" (
    "IdCliente" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Nombre" TEXT NOT NULL,
    "Cedula" TEXT,
    "Telefono" TEXT,
    "Email" TEXT,
    "Direccion" TEXT,
    "Estado" TEXT NOT NULL DEFAULT 'activo',
    "FechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Cliente" ("Cedula", "Direccion", "Email", "FechaRegistro", "IdCliente", "Nombre", "Telefono") SELECT "Cedula", "Direccion", "Email", "FechaRegistro", "IdCliente", "Nombre", "Telefono" FROM "Cliente";
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_Cedula_key" ON "Cliente"("Cedula");
CREATE TABLE "new_ConsolidacionCapital" (
    "IdConsolidacion" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdGasto" INTEGER NOT NULL,
    "FechaInicio" DATETIME,
    "FechaFin" DATETIME,
    "CapitalEntrante" DECIMAL NOT NULL,
    "CapitalSaliente" DECIMAL NOT NULL,
    "Observaciones" TEXT,
    "FechaGeneracion" DATETIME NOT NULL
);
INSERT INTO "new_ConsolidacionCapital" ("CapitalEntrante", "CapitalSaliente", "FechaFin", "FechaGeneracion", "FechaInicio", "IdConsolidacion", "Observaciones") SELECT "CapitalEntrante", "CapitalSaliente", "FechaFin", "FechaGeneracion", "FechaInicio", "IdConsolidacion", "Observaciones" FROM "ConsolidacionCapital";
DROP TABLE "ConsolidacionCapital";
ALTER TABLE "new_ConsolidacionCapital" RENAME TO "ConsolidacionCapital";
CREATE TABLE "new_GastoFijo" (
    "IdGasto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Nombre" TEXT NOT NULL,
    "Monto" DECIMAL NOT NULL,
    "Frecuencia" TEXT NOT NULL,
    "Dia1" INTEGER NOT NULL,
    "Dia2" INTEGER,
    "Activo" BOOLEAN NOT NULL,
    "consolidacionCapitalIdConsolidacion" INTEGER,
    CONSTRAINT "GastoFijo_consolidacionCapitalIdConsolidacion_fkey" FOREIGN KEY ("consolidacionCapitalIdConsolidacion") REFERENCES "ConsolidacionCapital" ("IdConsolidacion") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GastoFijo" ("Activo", "Dia1", "Dia2", "Frecuencia", "IdGasto", "Monto", "Nombre") SELECT "Activo", "Dia1", "Dia2", "Frecuencia", "IdGasto", "Monto", "Nombre" FROM "GastoFijo";
DROP TABLE "GastoFijo";
ALTER TABLE "new_GastoFijo" RENAME TO "GastoFijo";
CREATE TABLE "new_Prestatario" (
    "IdPrestatario" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Nombre" TEXT NOT NULL,
    "Telefono" TEXT,
    "Email" TEXT,
    "Clave" TEXT NOT NULL
);
INSERT INTO "new_Prestatario" ("Clave", "Email", "IdPrestatario", "Nombre", "Telefono") SELECT "Clave", "Email", "IdPrestatario", "Nombre", "Telefono" FROM "Prestatario";
DROP TABLE "Prestatario";
ALTER TABLE "new_Prestatario" RENAME TO "Prestatario";
CREATE TABLE "new_Volante" (
    "IdVolante" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "IdPrestamo" INTEGER NOT NULL,
    "IdPago" INTEGER NOT NULL,
    "TipoVolante" TEXT NOT NULL,
    "FechaGeneracion" DATETIME NOT NULL,
    CONSTRAINT "Volante_IdPrestamo_fkey" FOREIGN KEY ("IdPrestamo") REFERENCES "Prestamo" ("IdPrestamo") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Volante_IdPago_fkey" FOREIGN KEY ("IdPago") REFERENCES "Pago" ("IdPago") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Volante" ("FechaGeneracion", "IdPrestamo", "IdVolante", "TipoVolante") SELECT "FechaGeneracion", "IdPrestamo", "IdVolante", "TipoVolante" FROM "Volante";
DROP TABLE "Volante";
ALTER TABLE "new_Volante" RENAME TO "Volante";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
