import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './features/auth/routes';
import projectsRoutes from './features/projects/routes';
import physicalProgressRoutes from './features/physical-progress/routes';
import financialRoutes from './features/financial-planning/routes';
import costPlanningRoutes from './features/cost-planning/routes/cost.routes';
import companiesRoutes from './features/companies/routes/company.routes';
import usersRoutes from './features/users/routes/user.routes';
import userManagementRoutes from './features/user-management/routes/user-management.routes';
import fileGalleryRoutes from './features/file-gallery/routes/file-gallery.routes';
import executiveRoutes from './features/executive/routes';
import reportsRoutes from './features/reports/routes/reports.routes.js';
import { swaggerSpec } from './config/swagger';
import { UPLOADS_DIR } from './config/paths.js';
import { createProjectManagementRouter } from './modules/project-management/project-management.module.js';
import { createQualityControlRouter } from './modules/quality-control/index.js';
import { prisma } from './prisma/prisma.js';

const app = express();

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Confiar en proxies (Vite, nginx, etc.) para rate limiting y IPs correctas
// En desarrollo con Vite proxy, esto permite que express-rate-limit funcione
app.set('trust proxy', true);

app.use(cors());
app.use(express.json());

// Servir el archivo YAML para que los clientes puedan descargarlo
app.get('/api-docs/swagger.yaml', (_req, res) => {
  const yamlPath = resolve(__dirname, '../docs/openapi.yaml');
  res.sendFile(yamlPath);
});

// Documentación de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Business ERP API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true,
    url: '/api-docs/swagger.yaml',
  },
}));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/user-management', userManagementRoutes);
app.use('/api/physical-progress', physicalProgressRoutes);
app.use('/api/financial-planning', financialRoutes);
app.use('/api/cost-planning', costPlanningRoutes);
app.use('/api/file-gallery', fileGalleryRoutes);

// Módulo Ejecutivo (Sistema de Seguimiento de Indicadores) — JWT y roles propios
app.use('/api/executive', executiveRoutes);

// Reportes e impresión PDF (.ejs + Puppeteer)
app.use('/api/reports', reportsRoutes);

// Módulo Project Management (auth + satélites)
app.use('/api/project-management', createProjectManagementRouter({ prisma }));

// Módulo Quality Control (gestión de calidad)
app.use('/api/quality-control', createQualityControlRouter({ prisma }));

// Servir archivos estáticos (uploads) — ruta configurable para volumen persistente
app.use('/uploads', express.static(UPLOADS_DIR));

// Manejo de errores global: responde 400 para JSON malformado y propaga el
// resto de errores al handler por defecto de Express (500 con detalle) en
// lugar de tragarlos y devolver un falso 404.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    res.status(400).json({
      error: 'JSON malformado',
      message: 'El cuerpo de la petición no es un JSON válido. Revisa las comillas y el formato.'
    });
    return;
  }
  next(err);
});

// En producción, servir los archivos estáticos de React (SPA)
if (process.env.NODE_ENV === 'production') {
  // Ruta al dist del frontend (relativa al dist del backend)
  const frontendDist = resolve(__dirname, '../../frontend/dist');

  // Servir archivos estáticos de React
  app.use(express.static(frontendDist));

  // Fallback para SPA: cualquier ruta que no sea /api, /api-docs o /uploads devuelve index.html
  // Este middleware debe ir al final de todos los middlewares
  app.use((req, res, next) => {
    // Si la ruta empieza con /api, /api-docs o /uploads, continuar al siguiente middleware
    if (req.path.startsWith('/api') || req.path.startsWith('/api-docs') || req.path.startsWith('/uploads')) {
      return next('route');
    }

    // Para cualquier otra ruta, servir el index.html de React
    res.sendFile(resolve(frontendDist, 'index.html'));
  });
} else {
  // Ruta raíz solo en desarrollo
  app.get('/', (_req, res) => {
    res.json({
      name: 'Business ERP API',
      version: '1.0.0',
      documentation: '/api-docs',
      openapi: '/api-docs/swagger.yaml',
    });
  });
}

export default app;
