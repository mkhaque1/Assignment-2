import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { create, getAll, getOne, update, remove } from './issues.controller';

const router = Router();

// POST
router.post('/', authenticate, create);

router.get('/', getAll);
router.get('/:id', getOne);

// PATCH
router.patch('/:id', authenticate, update);

// DELETE
router.delete('/:id', authenticate, requireRole('maintainer'), remove);

export default router;
