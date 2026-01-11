import { Router } from 'express';
import { login, refresh, logout, me } from '../controllers/auth.controller';
import { auth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', auth, logout);
router.get('/me', auth, me);

export default router;
