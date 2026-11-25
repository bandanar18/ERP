-- Add email verification and OTP fields to pm_users
ALTER TABLE "pm_users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pm_users" ADD COLUMN "otpExpiresAt" TIMESTAMP(3);
ALTER TABLE "pm_users" ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "pm_users" ADD COLUMN "lastOtpSentAt" TIMESTAMP(3);

-- Create pm_otp_tokens table
CREATE TABLE "pm_otp_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_otp_tokens_pkey" PRIMARY KEY ("id")
);

-- Create pm_password_reset_tokens table
CREATE TABLE "pm_password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pm_password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "pm_otp_tokens" ADD CONSTRAINT "pm_otp_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pm_password_reset_tokens" ADD CONSTRAINT "pm_password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pm_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraints
CREATE UNIQUE INDEX "pm_password_reset_tokens_token_key" ON "pm_password_reset_tokens"("token");

-- Indexes
CREATE INDEX "pm_otp_tokens_email_idx" ON "pm_otp_tokens"("email");
CREATE INDEX "pm_otp_tokens_userId_idx" ON "pm_otp_tokens"("userId");
CREATE INDEX "pm_password_reset_tokens_userId_idx" ON "pm_password_reset_tokens"("userId");
