-- CreateTable
CREATE TABLE "file_gallery" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "path" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,

    CONSTRAINT "file_gallery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "file_gallery_entityType_entityId_idx" ON "file_gallery"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "file_gallery_uploadDate_idx" ON "file_gallery"("uploadDate");

-- CreateIndex
CREATE INDEX "file_gallery_entityId_idx" ON "file_gallery"("entityId");
