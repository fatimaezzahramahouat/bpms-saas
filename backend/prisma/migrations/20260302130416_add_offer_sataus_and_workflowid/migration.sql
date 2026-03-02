-- CreateEnum
CREATE TYPE "JobOfferStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'FILLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "status" "JobOfferStatus" NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "workflowId" TEXT;

-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "metadata" JSONB;

-- CreateIndex
CREATE INDEX "JobOffer_status_idx" ON "JobOffer"("status");

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
