import { Router } from 'express';
import { login, logout, me, signup } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.post('/logout', auth, logout);
router.get('/me', auth, me);

export default router;
