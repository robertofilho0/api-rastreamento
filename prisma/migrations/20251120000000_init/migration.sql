-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "tracking_jobs" (
    "id" UUID NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "total" INTEGER NOT NULL,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "succeeded" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "tracking_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_job_items" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "code" VARCHAR(13) NOT NULL,
    "success" BOOLEAN,
    "error" VARCHAR(300),
    "result" JSONB,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "tracking_job_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tracking_jobs_status_idx" ON "tracking_jobs"("status");

-- CreateIndex
CREATE INDEX "tracking_job_items_job_id_position_idx" ON "tracking_job_items"("job_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "tracking_job_items_job_id_code_key" ON "tracking_job_items"("job_id", "code");

-- AddForeignKey
ALTER TABLE "tracking_job_items" ADD CONSTRAINT "tracking_job_items_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "tracking_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
