CREATE TABLE "TelegramSession" (
    "chatId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("chatId")
);

CREATE TABLE "TelegramUpdate" (
    "updateId" INTEGER NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TelegramUpdate_pkey" PRIMARY KEY ("updateId")
);
