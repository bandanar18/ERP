import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrateData() {
  console.log('Starting data migration to pm_* tables...');
  
  // 1. Users
  console.log('Migrating users...');
  const users = await prisma.erpUser.findMany({
    include: { role: true }
  });
  
  let mappedRolesCount = 0;
  for (const user of users) {
    if (!user.role) continue;
    
    const roleName = user.role.name.toLowerCase();
    let pmRoleName = null;
    
    if (roleName === 'administrador') pmRoleName = 'PM_ADMIN';
    else if (roleName === 'gestion') pmRoleName = 'PM_GESTION';
    else if (roleName === 'planificador') pmRoleName = 'PM_PLANIFICADOR';
    else if (roleName === 'direccion') pmRoleName = 'PM_DIRECCION';
    
    if (pmRoleName) {
      // Find PM role ID
      const pmRole = await prisma.pmRole.findUnique({ where: { code: pmRoleName } });
      if (!pmRole) {
        console.warn(`Warning: Role ${pmRoleName} not found in pm_roles.`);
        continue;
      }
      
      const existingPmUser = await prisma.pmModuleUser.findUnique({ where: { externalId: user.id } });
      
      if (!existingPmUser) {
        const createdUser = await prisma.pmModuleUser.create({
          data: {
            externalId: user.id,
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE',
          }
        });
        
        await prisma.pmUserRole.create({
          data: {
            userId: createdUser.id,
            roleId: pmRole.id
          }
        });
        
        mappedRolesCount++;
      }
    }
  }
  console.log(`Mapped ${mappedRolesCount} ERP users to PM users.`);

  // 2. Companies
  console.log('Migrating companies...');
  const companies = await prisma.$queryRaw<any[]>`SELECT * FROM companies`;
  let companiesCount = 0;
  for (const company of companies) {
    const existing = await prisma.pmCompany.findUnique({ where: { id: company.id } });
    if (!existing) {
      await prisma.pmCompany.create({
        data: {
          id: company.id,
          name: company.name,
          taxId: company.taxId,
          legalName: company.legalName,
          address: company.address,
          phone: company.phone,
          email: company.email,
          logoUrl: company.logoUrl,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
        }
      });
      companiesCount++;
    }
  }
  console.log(`Migrated ${companiesCount} companies.`);

  // 3. Projects
  console.log('Migrating projects...');
  const projects = await prisma.$queryRaw<any[]>`SELECT * FROM projects`;
  let projectsCount = 0;
  for (const project of projects) {
    const existing = await prisma.pmProject.findUnique({ where: { id: project.id } });
    if (!existing) {
      let pmManagerId = null;
      if (project.managerId) {
        const pmUser = await prisma.pmModuleUser.findUnique({ where: { externalId: project.managerId } });
        if (pmUser) pmManagerId = pmUser.id;
      }
      
      await prisma.pmProject.create({
        data: {
          id: project.id,
          code: project.code,
          fullName: project.fullName,
          shortName: project.shortName,
          description: project.description,
          status: project.status,
          companyId: project.companyId,
          managerId: pmManagerId,
          startDate: project.startDate,
          endDate: project.endDate,
          offeredAmount: project.offeredAmount,
          estimatedCost: project.estimatedCost,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        }
      });
      projectsCount++;
    }
  }
  console.log(`Migrated ${projectsCount} projects.`);

  // 4. Avance Fisico
  console.log('Migrating physical progress...');
  const avances = await prisma.$queryRaw<any[]>`SELECT * FROM avance_fisico`;
  let avancesCount = 0;
  for (const avance of avances) {
    const existing = await prisma.pmPhysicalProgress.findUnique({ where: { id: avance.id } });
    if (!existing) {
      await prisma.pmPhysicalProgress.create({
        data: {
          id: avance.id,
          projectId: avance.projectId,
          date: avance.date,
          actualProgress: avance.actualProgress,
          plannedProgress: avance.plannedProgress,
          attentionPoints: avance.attentionPoints,
          startDate: avance.startDate,
          endDate: avance.endDate,
          createdAt: avance.createdAt,
          updatedAt: avance.updatedAt,
        }
      });
      avancesCount++;
    }
  }
  console.log(`Migrated ${avancesCount} physical progress records.`);

  // 5. Financial Valuations
  console.log('Migrating financial valuations...');
  const vals = await prisma.$queryRaw<any[]>`SELECT * FROM financial_valuations`;
  let valsCount = 0;
  for (const val of vals) {
    const existing = await prisma.pmFinancialValuation.findUnique({ where: { id: val.id } });
    if (!existing) {
      await prisma.pmFinancialValuation.create({
        data: {
          id: val.id,
          projectId: val.projectId,
          valuationNumber: val.valuationNumber,
          amountUsd: val.amountUsd,
          startDate: val.startDate,
          endDate: val.endDate,
          status: val.status,
          invoiceNumber: val.invoiceNumber,
          createdAt: val.createdAt,
          updatedAt: val.updatedAt,
        }
      });
      valsCount++;
    }
  }
  console.log(`Migrated ${valsCount} financial valuations.`);

  // 6. Cost Plannings
  console.log('Migrating cost plannings...');
  const costs = await prisma.$queryRaw<any[]>`SELECT * FROM cost_plannings`;
  let costsCount = 0;
  for (const cost of costs) {
    const existing = await prisma.pmCostPlanning.findUnique({ where: { id: cost.id } });
    if (!existing) {
      await prisma.pmCostPlanning.create({
        data: {
          id: cost.id,
          projectId: cost.projectId,
          amountUsd: cost.amountUsd,
          startDate: cost.startDate,
          endDate: cost.endDate,
          createdAt: cost.createdAt,
          updatedAt: cost.updatedAt,
        }
      });
      costsCount++;
    }
  }
  console.log(`Migrated ${costsCount} cost plannings.`);

  // 7. File Gallery
  console.log('Migrating file gallery...');
  const files = await prisma.$queryRaw<any[]>`SELECT * FROM file_gallery`;
  let filesCount = 0;
  for (const file of files) {
    const existing = await prisma.pmGalleryFile.findUnique({ where: { id: file.id } });
    if (!existing) {
      await prisma.pmGalleryFile.create({
        data: {
          id: file.id,
          entityId: file.entityId,
          entityType: file.entityType,
          fileName: file.fileName,
          originalName: file.originalName,
          mimeType: file.mimeType,
          size: file.size,
          path: file.path,
          uploadDate: file.uploadDate,
          description: file.description,
          category: file.category,
        }
      });
      filesCount++;
    }
  }
  console.log(`Migrated ${filesCount} gallery files.`);
  
  console.log('Data migration complete!');
}

migrateData()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
