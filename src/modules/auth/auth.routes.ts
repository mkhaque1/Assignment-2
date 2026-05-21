import { Router } from 'express';
import { signup, login } from './auth.controller';

const router = Router();

// POST method signup
router.post('/signup', signup);

// POST login
router.post('/login', login);

export default router;
