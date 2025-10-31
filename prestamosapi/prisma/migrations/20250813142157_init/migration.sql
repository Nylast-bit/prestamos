/*
  Warnings:

  - You are about to drop the column `consolidacionCapitalIdConsolidacion` on the `GastoFijo` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GastoFijo" (
    "IdGasto" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "Nombre" TEXT NOT NULL,
    "Monto" DECIMAL NOT NULL,
    "Frecuencia" TEXT NOT NULL,
    "Dia1" INTEGER NOT NULL,
    "Dia2" INTEGER,
    "Activo" BOOLEAN NOT NULL
);
INSERT INTO "new_GastoFijo" ("Activo", "Dia1", "Dia2", "Frecuencia", "IdGasto", "Monto", "Nombre") SELECT "Activo", "Dia1", "Dia2", "Frecuencia", "IdGasto", "Monto", "Nombre" FROM "GastoFijo";
DROP TABLE "GastoFijo";
ALTER TABLE "new_GastoFijo" RENAME TO "GastoFijo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
