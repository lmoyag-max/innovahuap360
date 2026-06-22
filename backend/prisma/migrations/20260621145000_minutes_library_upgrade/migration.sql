-- CreateEnum
CREATE TYPE "MinuteStatus" AS ENUM ('BORRADOR', 'PUBLICADA', 'ARCHIVADA');

-- AlterTable
ALTER TABLE "minutes" ADD COLUMN     "commitments" TEXT,
ADD COLUMN     "document_upload_id" TEXT,
ADD COLUMN     "key_agreements_note" TEXT,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "participants" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "secretary" TEXT,
ADD COLUMN     "status" "MinuteStatus" NOT NULL DEFAULT 'PUBLICADA',
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "minutes_document_upload_id_key" ON "minutes"("document_upload_id");

-- AddForeignKey
ALTER TABLE "minutes" ADD CONSTRAINT "minutes_document_upload_id_fkey" FOREIGN KEY ("document_upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

