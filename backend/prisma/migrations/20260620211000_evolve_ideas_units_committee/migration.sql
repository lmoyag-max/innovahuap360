-- CreateEnum
CREATE TYPE "IdeaProjectType" AS ENUM ('GESTION_CLINICA', 'GESTION_ADMINISTRATIVA', 'ACADEMICO_IDI');

-- CreateEnum
CREATE TYPE "IdeaProjectStage" AS ENUM ('IDEA', 'DESARROLLO', 'PILOTO_IMPLEMENTACION');

-- CreateTable (creadas ANTES de migrar el enum IdeaStatus: idea_status_history
-- referencia ese tipo y debe existir para que el bloque AlterEnum de más abajo
-- pueda convertir sus columnas)
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_members" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_comments" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "author_id" TEXT,
    "author_name" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_status_history" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "from_status" "IdeaStatus",
    "to_status" "IdeaStatus" NOT NULL,
    "changed_by_name" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_status_history_pkey" PRIMARY KEY ("id")
);

-- AlterEnum
BEGIN;
CREATE TYPE "IdeaStatus_new" AS ENUM ('RECIBIDA', 'EN_REVISION', 'OBSERVADA', 'FACTIBILIDAD', 'APROBADA', 'RECHAZADA', 'EN_EJECUCION', 'CERRADA');
ALTER TABLE "ideas" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ideas" ALTER COLUMN "status" TYPE "IdeaStatus_new" USING ("status"::text::"IdeaStatus_new");
ALTER TABLE "idea_status_history" ALTER COLUMN "from_status" TYPE "IdeaStatus_new" USING ("from_status"::text::"IdeaStatus_new");
ALTER TABLE "idea_status_history" ALTER COLUMN "to_status" TYPE "IdeaStatus_new" USING ("to_status"::text::"IdeaStatus_new");
ALTER TYPE "IdeaStatus" RENAME TO "IdeaStatus_old";
ALTER TYPE "IdeaStatus_new" RENAME TO "IdeaStatus";
DROP TYPE "IdeaStatus_old";
ALTER TABLE "ideas" ALTER COLUMN "status" SET DEFAULT 'RECIBIDA';
COMMIT;

-- AlterTable
ALTER TABLE "ideas" DROP COLUMN "scope",
DROP COLUMN "unit",
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "ficha_upload_id" TEXT NOT NULL,
ADD COLUMN     "jefatura_approval" BOOLEAN NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "project_stage" "IdeaProjectStage" NOT NULL,
ADD COLUMN     "project_type" "IdeaProjectType" NOT NULL,
ADD COLUMN     "unit_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "committee_members_user_id_key" ON "committee_members"("user_id");

-- CreateIndex
CREATE INDEX "idea_comments_idea_id_idx" ON "idea_comments"("idea_id");

-- CreateIndex
CREATE INDEX "idea_status_history_idea_id_idx" ON "idea_status_history"("idea_id");

-- CreateIndex
CREATE UNIQUE INDEX "ideas_ficha_upload_id_key" ON "ideas"("ficha_upload_id");

-- CreateIndex
CREATE INDEX "ideas_unit_id_idx" ON "ideas"("unit_id");

-- AddForeignKey
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_ficha_upload_id_fkey" FOREIGN KEY ("ficha_upload_id") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_comments" ADD CONSTRAINT "idea_comments_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_status_history" ADD CONSTRAINT "idea_status_history_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
