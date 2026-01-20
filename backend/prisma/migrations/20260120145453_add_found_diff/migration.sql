-- CreateTable
CREATE TABLE "FoundDiff" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "diffId" TEXT NOT NULL,
    "foundAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoundDiff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoundDiff_attemptId_idx" ON "FoundDiff"("attemptId");

-- CreateIndex
CREATE UNIQUE INDEX "FoundDiff_attemptId_diffId_key" ON "FoundDiff"("attemptId", "diffId");

-- AddForeignKey
ALTER TABLE "FoundDiff" ADD CONSTRAINT "FoundDiff_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoundDiff" ADD CONSTRAINT "FoundDiff_diffId_fkey" FOREIGN KEY ("diffId") REFERENCES "Diff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
