import { PrismaClient } from '@prisma/client';
import { Router } from 'express';

// Auth core (infrastructure)
import { JwtService } from './infrastructure/auth/jwt.service.js';
import { BcryptService } from './infrastructure/auth/bcrypt.service.js';
import { PrismaModuleAuthRepository } from './infrastructure/persistence/prisma-module-auth.repository.js';
import { AuthService } from './application/services/auth.service.js';
import { AuthController } from './interface/controllers/auth.controller.js';
import { createAuthRouter } from './interface/routes/auth.routes.js';
import { createPmAuthMiddleware } from './interface/middleware/pm-auth.middleware.js';

// Satélite: usuarios del módulo
import { PrismaModuleUserRepository } from './infrastructure/persistence/prisma-module-user.repository.js';
import { ModuleUserService } from './application/services/module-user.service.js';
import { ModuleUserController } from './interface/controllers/module-user.controller.js';
import { createModuleUserRoutes } from './interface/routes/module-user.routes.js';

// Satélite: usuarios ERP
import { PrismaErpUsersAdapter } from './infrastructure/adapters/prisma-erp-users.adapter.js';
import { ListErpUsersUseCase } from './application/use-cases/erp-users/list-erp-users.use-case.js';
import { GetErpUserUseCase } from './application/use-cases/erp-users/get-erp-user.use-case.js';
import { CreateErpUserUseCase } from './application/use-cases/erp-users/create-erp-user.use-case.js';
import { UpdateErpUserUseCase } from './application/use-cases/erp-users/update-erp-user.use-case.js';
import { DeleteErpUserUseCase } from './application/use-cases/erp-users/delete-erp-user.use-case.js';
import { ErpUsersService } from './application/services/erp-users.service.js';
import { ErpUsersController } from './interface/controllers/erp-users.controller.js';
import { createErpUsersRouter } from './interface/routes/erp-users.routes.js';

// Satélite: valuaciones financieras
import { PrismaFinancialValuationRepository } from './infrastructure/persistence/prisma-financial-valuation.repository.js';
import { FinancialValuationService } from './application/services/financial-valuation.service.js';
import { FinancialValuationController } from './interface/controllers/financial-valuation.controller.js';
import { createFinancialValuationRouter } from './interface/routes/financial-valuation.routes.js';

// Satélite: cost planning
import { PmCostPlanningPrismaRepository } from './infrastructure/persistence/prisma/pm-cost-planning.prisma.repository.js';
import { PmCostPlanningService } from './application/services/pm-cost-planning.service.js';
import { PmCostPlanningController } from './interface/controllers/pm-cost-planning.controller.js';
import { createCostPlanningRouter } from './interface/routes/pm-cost-planning.routes.js';

// Satélite: galería de archivos
import { PmGalleryFilePrismaRepository } from './infrastructure/persistence/prisma/pm-gallery-file.prisma.repository.js';
import { UploadPmGalleryFileUseCase } from './application/use-cases/pm-gallery-files/upload-file.use-case.js';
import { GetPmGalleryFilesUseCase } from './application/use-cases/pm-gallery-files/get-files.use-case.js';
import { StorageService } from './infrastructure/storage/storage.service.js';
import { PmGalleryFileService } from './application/services/pm-gallery-file.service.js';
import { PmGalleryFileController } from './interface/controllers/pm-gallery-file.controller.js';
import { createPmGalleryFileRouter } from './interface/routes/pm-gallery-file.routes.js';

// Submódulo: cuentas por pagar
import { PayablesService } from './application/services/payables.service.js';
import { PayablesController } from './interface/controllers/payables.controller.js';
import { createPayablesRouter } from './interface/routes/payables.routes.js';

// Router compuesto
import { createModuleRouter } from './interface/routes/index.js';

export interface ProjectManagementDeps {
  prisma: PrismaClient;
}

export function createProjectManagementRouter(deps: ProjectManagementDeps): Router {
  // ---- Auth core ----
  const jwtService = new JwtService();
  const hasher = new BcryptService();
  const moduleAuthRepo = new PrismaModuleAuthRepository(deps.prisma);

  const authService = new AuthService(moduleAuthRepo, jwtService, hasher);
  const pmAuthMiddleware = createPmAuthMiddleware(jwtService, authService);

  const authController = new AuthController(authService);
  const authRouter = createAuthRouter(authController, pmAuthMiddleware);

  // ---- Satélite: usuarios del módulo ----
  const moduleUserRepo = new PrismaModuleUserRepository(deps.prisma);
  const moduleUserService = new ModuleUserService(moduleUserRepo);
  const moduleUserController = new ModuleUserController(moduleUserService);
  const moduleUsersRouter = createModuleUserRoutes(moduleUserController, pmAuthMiddleware);

  // ---- Satélite: usuarios ERP ----
  const erpUsersAdapter = new PrismaErpUsersAdapter(deps.prisma);
  const erpUsersService = new ErpUsersService(
    new ListErpUsersUseCase(erpUsersAdapter),
    new GetErpUserUseCase(erpUsersAdapter),
    new CreateErpUserUseCase(erpUsersAdapter),
    new UpdateErpUserUseCase(erpUsersAdapter),
    new DeleteErpUserUseCase(erpUsersAdapter)
  );
  const erpUsersController = new ErpUsersController(erpUsersService);
  const erpUsersRouter = createErpUsersRouter(erpUsersController, pmAuthMiddleware);

  // ---- Satélite: valuaciones financieras ----
  const financialRepo = new PrismaFinancialValuationRepository(deps.prisma);
  const financialService = new FinancialValuationService(financialRepo);
  const financialController = new FinancialValuationController(financialService);
  const financialValuationsRouter = createFinancialValuationRouter(financialController, pmAuthMiddleware);

  // ---- Satélite: cost planning ----
  const costRepo = new PmCostPlanningPrismaRepository(deps.prisma);
  const costService = new PmCostPlanningService(costRepo);
  const costController = new PmCostPlanningController(costService);
  const costPlanningsRouter = createCostPlanningRouter(costController, pmAuthMiddleware);

  // ---- Satélite: galería de archivos ----
  const galleryRepo = new PmGalleryFilePrismaRepository(deps.prisma);
  const storageService = new StorageService();
  const galleryService = new PmGalleryFileService(
    new UploadPmGalleryFileUseCase(galleryRepo),
    new GetPmGalleryFilesUseCase(galleryRepo),
    galleryRepo,
    storageService
  );
  const galleryController = new PmGalleryFileController(galleryService);
  const galleryFilesRouter = createPmGalleryFileRouter(galleryController, pmAuthMiddleware);

  // ---- Submódulo: cuentas por pagar ----
  const payablesService = new PayablesService(deps.prisma);
  const payablesRouter = createPayablesRouter(new PayablesController(payablesService), pmAuthMiddleware);

  return createModuleRouter({
    authRouter,
    moduleUsersRouter,
    erpUsersRouter,
    financialValuationsRouter,
    costPlanningsRouter,
    galleryFilesRouter,
    payablesRouter,
  });
}
