/*
  Warnings:

  - Added the required column `updatedAt` to the `Workflow` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- DropForeignKey
ALTER TABLE "Rule" DROP CONSTRAINT "Rule_stepId_fkey";

-- DropForeignKey
ALTER TABLE "Step" DROP CONSTRAINT "Step_workflowId_fkey";

-- AlterTable
ALTER TABLE "Workflow" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "edges" JSONB DEFAULT '[]',
ADD COLUMN     "nodes" JSONB DEFAULT '[]',
ADD COLUMN     "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "Workflow_status_idx" ON "Workflow"("status");

-- CreateIndex
CREATE INDEX "Workflow_organisationId_idx" ON "Workflow"("organisationId");

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;
