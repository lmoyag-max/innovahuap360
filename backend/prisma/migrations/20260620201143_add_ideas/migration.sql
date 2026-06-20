-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('RECIBIDA', 'EN_TRIAGE', 'APROBADA', 'RECHAZADA', 'CONVERTIDA');

-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proponent_name" TEXT NOT NULL,
    "unit" TEXT,
    "scope" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'RECIBIDA',
    "votes" INTEGER NOT NULL DEFAULT 0,
    "triage_note" TEXT,
    "resulting_project_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ideas_status_idx" ON "ideas"("status");

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_resulting_project_id_fkey" FOREIGN KEY ("resulting_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
