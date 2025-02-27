-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShoppingList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShoppingList_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ShoppingList" ("createdAt", "id", "items", "mealPlanId", "userId") SELECT "createdAt", "id", "items", "mealPlanId", "userId" FROM "ShoppingList";
DROP TABLE "ShoppingList";
ALTER TABLE "new_ShoppingList" RENAME TO "ShoppingList";
CREATE UNIQUE INDEX "ShoppingList_userId_key" ON "ShoppingList"("userId");
CREATE UNIQUE INDEX "ShoppingList_mealPlanId_key" ON "ShoppingList"("mealPlanId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
