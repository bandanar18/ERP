export class PmGalleryFile {
  id!: string;
  fileName!: string;
  originalName!: string;
  mimeType!: string;
  size!: bigint;
  path!: string;
  uploadDate!: Date;
  module!: string;
  entityType!: string;
  entityId!: string;
  description?: string | null;
  category?: string | null;

  constructor(data: Partial<PmGalleryFile>) {
    Object.assign(this, data);
  }
}
