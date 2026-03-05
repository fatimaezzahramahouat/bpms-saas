-- CreateEnum
CREATE TYPE "StatusSource" AS ENUM ('MANUAL', 'AUTOMATIC');

-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "statusSource" "StatusSource" NOT NULL DEFAULT 'MANUAL';
