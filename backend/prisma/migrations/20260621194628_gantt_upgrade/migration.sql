-- CreateEnum
CREATE TYPE "ProjectTaskType" AS ENUM ('HITO', 'TAREA');

-- CreateEnum
CREATE TYPE "ProjectTaskStatus" AS ENUM ('PENDIENTE', 'EN_DESARROLLO', 'EN_RIESGO', 'ATRASADO', 'COMPLETADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ProjectTaskPriority" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- AlterTable
ALTER TABLE "project_tasks" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_critical" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "priority" "ProjectTaskPriority" NOT NULL DEFAULT 'MEDIA',
ADD COLUMN     "responsible_name" TEXT,
ADD COLUMN     "status" "ProjectTaskStatus" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "type" "ProjectTaskType" NOT NULL DEFAULT 'TAREA',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "project_task_dependencies" (
    "task_id" TEXT NOT NULL,
    "depends_on_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_task_dependencies_pkey" PRIMARY KEY ("task_id","depends_on_id")
);

-- CreateTable
CREATE TABLE "project_task_attachments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_task_history" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "changed_by_name" TEXT,
    "field" TEXT NOT NULL,
    "from_value" TEXT,
    "to_value" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_task_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_task_attachments_upload_id_key" ON "project_task_attachments"("upload_id");

-- CreateIndex
CREATE INDEX "project_task_history_task_id_idx" ON "project_task_history"("task_id");

-- CreateIndex
CREATE INDEX "project_tasks_project_id_deleted_at_idx" ON "project_tasks"("project_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "project_task_dependencies" ADD CONSTRAINT "project_task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_dependencies" ADD CONSTRAINT "project_task_dependencies_depends_on_id_fkey" FOREIGN KEY ("depends_on_id") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_attachments" ADD CONSTRAINT "project_task_attachments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_attachments" ADD CONSTRAINT "project_task_attachments_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_task_history" ADD CONSTRAINT "project_task_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "project_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

