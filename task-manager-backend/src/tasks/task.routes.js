import { Router } from 'express';
import * as controller from './task.controller.js';
import { validateCreate, validateUpdate, validateId } from './task.validation.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', controller.getAll);
router.post('/', validateCreate, controller.create);
router.get('/:id', validateId, controller.getById);
router.put('/:id', validateUpdate, controller.update);
router.delete('/:id', validateId, controller.remove);

export default router;
