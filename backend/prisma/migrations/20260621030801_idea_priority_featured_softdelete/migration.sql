-- CreateEnum
CREATE TYPE "IdeaPriority" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- AlterTable
ALTER TABLE "ideas" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" "IdeaPriority" NOT NULL DEFAULT 'MEDIA';

