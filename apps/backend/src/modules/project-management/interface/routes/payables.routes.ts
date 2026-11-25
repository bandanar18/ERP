import { Router } from 'express';
import { PayablesController } from '../controllers/payables.controller.js';
import { pmCheckRoles } from '../middleware/pm-roles.middleware.js';

const READ = ['PM_ADMIN', 'PM_GESTION', 'PM_ADMIN_FINANCIERO'];
const WRITE = ['PM_ADMIN', 'PM_ADMIN_FINANCIERO'];

export function createPayablesRouter(controller: PayablesController, authMiddleware: any): Router {
  const router = Router();
  router.use(authMiddleware);

  // El control de scope por proyecto lo hace PayablesService.assertAccess (también para rutas por :id)
  router.get('/overview', pmCheckRoles(READ), controller.getOverview);
  router.get('/project/:projectId', pmCheckRoles(READ), controller.getByProject);
  router.post('/', pmCheckRoles(WRITE), controller.create);
  router.delete('/payments/:paymentId', pmCheckRoles(WRITE), controller.revertPayment);
  router.patch('/:id', pmCheckRoles(WRITE), controller.update);
  router.post('/:id/pay', pmCheckRoles(WRITE), controller.pay);
  router.patch('/:id/paid', pmCheckRoles(WRITE), controller.setPaid);
  router.patch('/:id/recognize', pmCheckRoles(WRITE), controller.recognize);
  router.patch('/obligations/:id/recognize', pmCheckRoles(WRITE), controller.recognize);
  router.patch('/project/:projectId/advance', pmCheckRoles(WRITE), controller.updateAdvance);
  router.delete('/:id', pmCheckRoles(WRITE), controller.remove);

  return router;
}
