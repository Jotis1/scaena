-- CreateTable
CREATE TABLE "studio_channel" (
    "twitchId" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "addedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studio_channel_pkey" PRIMARY KEY ("twitchId")
);

-- CreateIndex
CREATE UNIQUE INDEX "studio_channel_login_key" ON "studio_channel"("login");
