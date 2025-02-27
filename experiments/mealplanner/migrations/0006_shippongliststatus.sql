-- CreateTable
CREATE TABLE "ShoppingListStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListStatus_userId_key" ON "ShoppingListStatus"("userId");
