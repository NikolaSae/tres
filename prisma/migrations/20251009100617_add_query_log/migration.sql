-- CreateTable
CREATE TABLE "public"."query_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "query_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "query_logs_userId_createdAt_idx" ON "public"."query_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "query_logs_toolName_idx" ON "public"."query_logs"("toolName");

-- AddForeignKey
ALTER TABLE "public"."query_logs" ADD CONSTRAINT "query_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
