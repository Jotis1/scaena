-- CreateTable
CREATE TABLE "channel_profile" (
    "login" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_profile_pkey" PRIMARY KEY ("login")
);
