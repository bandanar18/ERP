import { PrismaClient } from '@prisma/client';

/**
 * Seed de galería de archivos (pm_gallery_files).
 *
 * Puebla la galería con imágenes reales de https://picsum.photos (seed
 * determinístico por proyecto/empresa) para que los proyectos y empresas
 * tengan historial visual en la galería del módulo PM.
 *
 * Nota: el `path` guarda la URL absoluta de la imagen. El controller de
 * file-gallery ya soporta paths absolutos (si empiezan con http:// o https://
 * devuelve el path tal cual como `url`).
 */
const PICSUM = (seed: string, w = 1200, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

const PROJECT_CATEGORIES = [
  { category: 'fotografias', desc: 'Fotografía de avance de obra' },
  { category: 'planos', desc: 'Plano y documentación técnica' },
  { category: 'informes', desc: 'Informe de avance mensual' },
  { category: 'reuniones', desc: 'Acta de reunión de seguimiento' },
];

const COMPANY_CATEGORIES = [
  { category: 'logos', desc: 'Logo de la empresa' },
  { category: 'certificaciones', desc: 'Certificación de la empresa' },
  { category: 'instalaciones', desc: 'Instalaciones de la empresa' },
];

const TITLES = ['Vista general', 'Detalle de ejecución', 'Entrega parcial', 'Inspección en sitio', 'Documento firmado', 'Materiales en obra'];

export async function seedGallery(prisma: PrismaClient) {
  console.log('  Seeding file gallery...');

  const projects = await prisma.pmProject.findMany();
  const companies = await prisma.pmCompany.findMany({ take: 20 });

  let count = 0;

  // ── Imágenes por proyecto (3-5 cada uno) ───────────────────────────────
  for (const project of projects) {
    const n = 3 + (project.code.charCodeAt(project.code.length - 1) % 3); // 3-5
    const seedBase = project.code.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (let i = 0; i < n; i++) {
      const meta = PROJECT_CATEGORIES[i % PROJECT_CATEGORIES.length];
      const title = TITLES[(i + project.code.length) % TITLES.length];
      const fileName = `pm-${seedBase}-${i + 1}.jpg`;

      await prisma.pmGalleryFile.create({
        data: {
          fileName,
          originalName: `${title} - ${project.shortName ?? project.code}.jpg`,
          mimeType: 'image/jpeg',
          size: BigInt(180_000 + ((i * 37) % 220_000)),
          path: PICSUM(`${seedBase}-${i + 1}`),
          module: 'PROJECT_MANAGEMENT',
          entityType: 'Project',
          entityId: project.id,
          description: `${meta.desc} — ${project.fullName}`,
          category: meta.category,
          uploadDate: new Date(Date.now() - (i + 1) * 5 * 24 * 60 * 60 * 1000),
        },
      });
      count++;
    }
  }

  // ── Imágenes por empresa (1-2 cada una) ────────────────────────────────
  for (const company of companies) {
    const n = 1 + (company.name.length % 2); // 1-2
    const seedBase = company.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 24);

    for (let i = 0; i < n; i++) {
      const meta = COMPANY_CATEGORIES[i % COMPANY_CATEGORIES.length];
      const fileName = `co-${seedBase}-${i + 1}.jpg`;

      await prisma.pmGalleryFile.create({
        data: {
          fileName,
          originalName: `${meta.desc} - ${company.name}.jpg`,
          mimeType: 'image/jpeg',
          size: BigInt(140_000 + ((i * 53) % 160_000)),
          path: PICSUM(`co-${seedBase}-${i + 1}`),
          module: 'PROJECT_MANAGEMENT',
          entityType: 'Company',
          entityId: company.id,
          description: `${meta.desc} — ${company.name}`,
          category: meta.category,
          uploadDate: new Date(Date.now() - (i + 1) * 9 * 24 * 60 * 60 * 1000),
        },
      });
      count++;
    }
  }

  console.log(`[Seed] Gallery files seeded: ${count}`);
  return count;
}
