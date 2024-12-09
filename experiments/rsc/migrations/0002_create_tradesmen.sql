-- CreateTable
CREATE TABLE "Tradesman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cellnumber" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "profilePicture" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Tradesman_cellnumber_key" ON "Tradesman"("cellnumber");