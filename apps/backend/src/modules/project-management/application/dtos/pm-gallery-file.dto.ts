import { z } from 'zod';

export const UploadPmGalleryFileSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
});

export type UploadPmGalleryFileDTO = z.infer<typeof UploadPmGalleryFileSchema>;

export const PmGalleryFileResponseSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  originalName: z.string(),
  mimeType: z.string(),
  size: z.number().or(z.bigint()).transform(v => Number(v)),
  path: z.string(),
  uploadDate: z.date().or(z.string()).transform(v => new Date(v)),
  module: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

export type PmGalleryFileResponseDTO = z.infer<typeof PmGalleryFileResponseSchema>;
