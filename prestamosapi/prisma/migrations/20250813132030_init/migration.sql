/*
  Warnings:

  - You are about to drop the column `IdGasto` on the `ConsolidacionCapital` table. All the data in the column will be lost.
  - Made the column `consolidacionCapitalIdConsolidacion` on table `GastoFijo` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ConsolidacionCapital" (
    "IdConsolidacion" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "consolidacionCapitalIdConsolidacion" INTEGER NOT NULL,
    CONSTRAINT "GastoFijo_consolidacionCapitalIdConsolidacion_fkey" FOREIGN KEY ("consolidacionCapitalIdConsolidacion") REFERENCES "ConsolidacionCapital" ("IdConsolidacion") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GastoFijo" ("Activo", "Dia1", "Dia2", "Frecuencia", "IdGasto", "Monto", "Nombre", "consolidacionCapitalIdConsolidacion") SELECT "Activo", "Dia1", "Dia2", "Frecuencia", "IdGasto", "Monto", "Nombre", "consolidacionCapitalIdConsolidacion" FROM "GastoFijo";
DROP TABLE "GastoFijo";
ALTER TABLE "new_GastoFijo" RENAME TO "GastoFijo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
