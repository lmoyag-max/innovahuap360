-- AlterTable
ALTER TABLE "public_content" ADD COLUMN     "mission" TEXT,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "secondary_body" TEXT,
ADD COLUMN     "vision" TEXT;

-- CreateTable
CREATE TABLE "about_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "unit" TEXT,
    "committee_role" TEXT,
    "email" TEXT,
    "photo_upload_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_axes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_axes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_objectives" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_objectives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_values" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about_documents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "file_upload_id" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "about_members_photo_upload_id_key" ON "about_members"("photo_upload_id");

-- CreateIndex
CREATE INDEX "about_members_is_active_sort_order_idx" ON "about_members"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "about_axes_is_active_sort_order_idx" ON "about_axes"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "about_objectives_is_active_sort_order_idx" ON "about_objectives"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "about_values_is_active_sort_order_idx" ON "about_values"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "about_documents_file_upload_id_key" ON "about_documents"("file_upload_id");

-- CreateIndex
CREATE INDEX "about_documents_is_published_sort_order_idx" ON "about_documents"("is_published", "sort_order");

-- AddForeignKey
ALTER TABLE "about_members" ADD CONSTRAINT "about_members_photo_upload_id_fkey" FOREIGN KEY ("photo_upload_id") REFERENCES "uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "about_documents" ADD CONSTRAINT "about_documents_file_upload_id_fkey" FOREIGN KEY ("file_upload_id") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

