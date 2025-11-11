import { Router } from 'express';
import { getAIResult } from '../controllers/ai.controller.js';
const router = Router();

router.get('/get-result',getAIResult)

export default router;