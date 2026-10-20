-- CreateTable
CREATE TABLE "Sync" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "status" TEXT NOT NULL,
    "mock" BOOLEAN NOT NULL DEFAULT false,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsRemaining" INTEGER,
    "competitionResults" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competition" TEXT NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "commenceTime" DATETIME NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "OddsSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "syncId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "bookmaker" TEXT NOT NULL,
    "bookmakerTitle" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "point" REAL,
    "price" REAL NOT NULL,
    CONSTRAINT "OddsSnapshot_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "Sync" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OddsSnapshot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "combinedProbability" REAL NOT NULL,
    "fairOdds" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "settledAt" DATETIME,
    CONSTRAINT "Template_syncId_fkey" FOREIGN KEY ("syncId") REFERENCES "Sync" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateLeg" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "market" TEXT NOT NULL,
    "selection" TEXT NOT NULL,
    "probability" REAL NOT NULL,
    "bookmakerCount" INTEGER NOT NULL,
    "result" TEXT,
    CONSTRAINT "TemplateLeg_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateLeg_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApiCallLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "httpStatus" INTEGER NOT NULL,
    "requestsRemaining" INTEGER,
    "requestsUsed" INTEGER,
    "requestsLast" INTEGER
);

-- CreateIndex
CREATE INDEX "Sync_startedAt_idx" ON "Sync"("startedAt");

-- CreateIndex
CREATE INDEX "Match_competition_commenceTime_idx" ON "Match"("competition", "commenceTime");

-- CreateIndex
CREATE INDEX "OddsSnapshot_syncId_matchId_idx" ON "OddsSnapshot"("syncId", "matchId");

-- CreateIndex
CREATE INDEX "Template_syncId_idx" ON "Template"("syncId");

-- CreateIndex
CREATE INDEX "TemplateLeg_templateId_idx" ON "TemplateLeg"("templateId");

-- CreateIndex
CREATE INDEX "ApiCallLog_at_idx" ON "ApiCallLog"("at");
