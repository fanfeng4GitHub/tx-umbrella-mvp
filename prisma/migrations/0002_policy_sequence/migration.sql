CREATE TABLE "PolicySequence" (
  "id" TEXT PRIMARY KEY,
  "state" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "lastNumber" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "PolicySequence_state_year_key" ON "PolicySequence"("state", "year");
