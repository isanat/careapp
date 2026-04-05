-- Add KYC document fields to User table
ALTER TABLE "User" ADD COLUMN "kycData" TEXT;
ALTER TABLE "User" ADD COLUMN "kycBirthDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "kycNationality" TEXT;
ALTER TABLE "User" ADD COLUMN "kycDocumentIssueDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "kycDocumentExpiryDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "kycDocumentIssuer" TEXT;
