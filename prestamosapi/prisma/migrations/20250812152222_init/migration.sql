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
    "FechaRegistro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Cliente" ("Cedula", "Direccion", "Email", "FechaRegistro", "IdCliente", "Nombre", "Telefono") SELECT "Cedula", "Direccion", "Email", "FechaRegistro", "IdCliente", "Nombre", "Telefono" FROM "Cliente";
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_Cedula_key" ON "Cliente"("Cedula");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
