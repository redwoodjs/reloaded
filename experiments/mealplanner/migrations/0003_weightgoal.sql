-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Setup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "height" REAL NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "dietaryPreferences" TEXT,
    "weightGoal" TEXT,
    "healthIssues" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Setup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Setup" ("activityLevel", "age", "createdAt", "dietaryPreferences", "gender", "healthIssues", "height", "id", "userId", "weight") SELECT "activityLevel", "age", "createdAt", "dietaryPreferences", "gender", "healthIssues", "height", "id", "userId", "weight" FROM "Setup";
DROP TABLE "Setup";
ALTER TABLE "new_Setup" RENAME TO "Setup";
CREATE UNIQUE INDEX "Setup_userId_key" ON "Setup"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
