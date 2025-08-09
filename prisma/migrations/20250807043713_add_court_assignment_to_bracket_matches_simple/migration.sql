/*
  Warnings:

  - You are about to drop the column `startTime` on the `BracketMatch` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BracketMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "teamAId" TEXT,
    "teamBId" TEXT,
    "teamAScore" INTEGER,
    "teamBScore" INTEGER,
    "scheduledCourt" INTEGER,
    "completedAt" DATETIME,
    "winnerAdvancesToMatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BracketMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BracketMatch" ("completedAt", "createdAt", "id", "matchNumber", "round", "scheduledCourt", "teamAId", "teamAScore", "teamBId", "teamBScore", "tournamentId", "winnerAdvancesToMatchId") SELECT "completedAt", "createdAt", "id", "matchNumber", "round", "scheduledCourt", "teamAId", "teamAScore", "teamBId", "teamBScore", "tournamentId", "winnerAdvancesToMatchId" FROM "BracketMatch";
DROP TABLE "BracketMatch";
ALTER TABLE "new_BracketMatch" RENAME TO "BracketMatch";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
