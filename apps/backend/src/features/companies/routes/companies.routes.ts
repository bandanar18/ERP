import { Router } from 'express';
import { CompanyController as CompaniesController } from '../controllers';

const router = Router();
const controller = new CompaniesController();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
