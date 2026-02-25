-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGENT', 'ADMIN');
CREATE TYPE "AccountType" AS ENUM ('PERSON', 'ENTITY');
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'QUOTED', 'ISSUED');
CREATE TYPE "OccupancyType" AS ENUM ('LRO', 'STR', 'VACANT');

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Account" (
  "id" TEXT PRIMARY KEY,
  "type" "AccountType" NOT NULL,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "mailingAddress1" TEXT NOT NULL,
  "mailingAddress2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zip" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Submission" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
  "effectiveDate" TIMESTAMP(3),
  "stateOfRisk" TEXT NOT NULL DEFAULT 'TX',
  "underlyingLiabilityLimit" INTEGER NOT NULL,
  "umbrellaLimit" INTEGER NOT NULL,
  "totalProperties" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Property" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT NOT NULL,
  "address1" TEXT NOT NULL,
  "address2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zip" TEXT NOT NULL,
  "occupancyType" "OccupancyType" NOT NULL DEFAULT 'LRO',
  "units" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Quote" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "basePremium" DECIMAL(10,2) NOT NULL,
  "taxesAndFees" DECIMAL(10,2) NOT NULL,
  "totalPremium" DECIMAL(10,2) NOT NULL,
  "ratingInputsJson" JSONB NOT NULL,
  "ratingOutputsJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Quote_submissionId_version_key" UNIQUE ("submissionId", "version")
);

CREATE TABLE "Policy" (
  "id" TEXT PRIMARY KEY,
  "policyNumber" TEXT NOT NULL UNIQUE,
  "submissionId" TEXT NOT NULL UNIQUE,
  "accountId" TEXT NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL,
  "effectiveDate" TIMESTAMP(3) NOT NULL,
  "expirationDate" TIMESTAMP(3) NOT NULL,
  "umbrellaLimit" INTEGER NOT NULL,
  "underlyingLiabilityLimit" INTEGER NOT NULL,
  "totalPremium" DECIMAL(10,2) NOT NULL,
  "decPdfPathOrBlobRef" TEXT NOT NULL,
  "createdByUserId" TEXT NOT NULL
);

CREATE TABLE "AuditEvent" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "detailsJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
