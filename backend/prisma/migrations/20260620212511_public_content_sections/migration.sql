-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "progress_pct" INTEGER,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "start_date" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public_content" ADD COLUMN     "category" TEXT,
ADD COLUMN     "document_upload_id" TEXT,
ADD COLUMN     "event_date" TIMESTAMP(3),
ADD COLUMN     "event_location" TEXT,
ADD COLUMN     "item_type" TEXT,
ADD COLUMN     "link_url" TEXT,
ADD COLUMN     "registration_url" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "public_content_document_upload_id_key" ON "public_content"("document_upload_id");

-- AddForeignKey
ALTER TABLE "public_content" ADD CONSTRAINT "public_content_document_upload_id_fkey" FOREIGN KEY ("document_upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

