-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "KnowledgeType" ADD VALUE 'DOCUMENTO';
ALTER TYPE "KnowledgeType" ADD VALUE 'MANUAL';
ALTER TYPE "KnowledgeType" ADD VALUE 'CASO_EXITO';
ALTER TYPE "KnowledgeType" ADD VALUE 'ARTICULO';
ALTER TYPE "KnowledgeType" ADD VALUE 'ENLACE';

-- AlterTable
ALTER TABLE "knowledge_items" ADD COLUMN     "link_url" TEXT;

-- AlterTable
ALTER TABLE "public_content" ADD COLUMN     "expected_benefits" TEXT,
ADD COLUMN     "related_project_id" TEXT;

-- AddForeignKey
ALTER TABLE "public_content" ADD CONSTRAINT "public_content_related_project_id_fkey" FOREIGN KEY ("related_project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

