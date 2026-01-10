import { Router } from 'express';
import { getRoot, getHealth } from '../controllers/index.controller';

const router = Router();

router.get('/', getRoot);
router.get('/health', getHealth);

export default router;
