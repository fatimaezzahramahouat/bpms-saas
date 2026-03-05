-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobOfferStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StatusSource" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('CDI', 'CDD', 'STAGE', 'FREELANCE', 'ALTERNANCE');

-- CreateEnum
CREATE TYPE "JobLevel" AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'LEAD', 'INTERN');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('CANDIDATE', 'CONTACTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nom_admin" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_org" TEXT,
    "nb_employers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgInfo" (
    "id" TEXT NOT NULL,
    "logo" TEXT,
    "domaine" TEXT,
    "address" TEXT,
    "city" TEXT,
    "website" TEXT,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resetExpires" TIMESTAMP(3),
    "resetToken" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "contractType" "ContractType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "level" "JobLevel" NOT NULL,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "workMode" "WorkMode" NOT NULL,
    "closedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "status" "JobOfferStatus" NOT NULL DEFAULT 'PUBLISHED',
    "workflowId" TEXT,
    "statusSource" "StatusSource" NOT NULL DEFAULT 'MANUAL',

    CONSTRAINT "JobOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "cv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'CANDIDATE',

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobOfferId" TEXT NOT NULL,
    "processInstanceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "applicationId" TEXT,
    "userId" TEXT,
    "organisationId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Manager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RH" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RH_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "edges" JSONB DEFAULT '[]',
    "nodes" JSONB DEFAULT '[]',
    "status" "WorkflowStatus" NOT NULL DEFAULT 'DRAFT',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "workflowId" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "Step_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "userId" TEXT,
    "processInstanceId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "logic" JSONB NOT NULL,
    "stepId" TEXT NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessInstance" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "workflowId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "processInstanceId" TEXT,
    "applicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidateId" VARCHAR(255),
    "educationScore" DOUBLE PRECISION,
    "experienceScore" DOUBLE PRECISION,
    "interviewQuestions" TEXT[],
    "jobOfferId" VARCHAR(255),
    "matchedSkills" TEXT[],
    "missingSkills" TEXT[],
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" TEXT,
    "recommendation" TEXT,
    "skillsScore" DOUBLE PRECISION,
    "strengths" TEXT[],
    "technicalFitScore" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weaknesses" TEXT[],

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "processInstanceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_email_key" ON "Organisation"("email");

-- CreateIndex
CREATE INDEX "Organisation_email_idx" ON "Organisation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrgInfo_organisationId_key" ON "OrgInfo"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_organisationId_idx" ON "User"("organisationId");

-- CreateIndex
CREATE INDEX "JobOffer_organisationId_idx" ON "JobOffer"("organisationId");

-- CreateIndex
CREATE INDEX "JobOffer_status_idx" ON "JobOffer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_email_key" ON "Candidate"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_processInstanceId_key" ON "Application"("processInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_candidateId_jobOfferId_key" ON "Application"("candidateId", "jobOfferId");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Manager_userId_key" ON "Manager"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RH_userId_key" ON "RH"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Workflow_status_idx" ON "Workflow"("status");

-- CreateIndex
CREATE INDEX "Workflow_organisationId_idx" ON "Workflow"("organisationId");

-- CreateIndex
CREATE INDEX "Task_organisationId_idx" ON "Task"("organisationId");

-- CreateIndex
CREATE INDEX "AIAnalysis_candidateId_idx" ON "AIAnalysis"("candidateId");

-- CreateIndex
CREATE INDEX "AIAnalysis_jobOfferId_idx" ON "AIAnalysis"("jobOfferId");

-- CreateIndex
CREATE INDEX "AIAnalysis_applicationId_idx" ON "AIAnalysis"("applicationId");

-- CreateIndex
CREATE INDEX "AIAnalysis_type_idx" ON "AIAnalysis"("type");

-- CreateIndex
CREATE INDEX "AIAnalysis_overallScore_idx" ON "AIAnalysis"("overallScore");

-- AddForeignKey
ALTER TABLE "OrgInfo" ADD CONSTRAINT "OrgInfo_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOffer" ADD CONSTRAINT "JobOffer_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_jobOfferId_fkey" FOREIGN KEY ("jobOfferId") REFERENCES "JobOffer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_processInstanceId_fkey" FOREIGN KEY ("processInstanceId") REFERENCES "ProcessInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Manager" ADD CONSTRAINT "Manager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RH" ADD CONSTRAINT "RH_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step" ADD CONSTRAINT "Step_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_processInstanceId_fkey" FOREIGN KEY ("processInstanceId") REFERENCES "ProcessInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessInstance" ADD CONSTRAINT "ProcessInstance_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_processInstanceId_fkey" FOREIGN KEY ("processInstanceId") REFERENCES "ProcessInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_processInstanceId_fkey" FOREIGN KEY ("processInstanceId") REFERENCES "ProcessInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventLog" ADD CONSTRAINT "EventLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

