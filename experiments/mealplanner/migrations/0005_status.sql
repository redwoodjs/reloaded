-- CreateTable
CREATE TABLE "MealPlanStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "MealPlanStatus_userId_key" ON "MealPlanStatus"("userId");
