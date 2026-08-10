import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getScore, getHistorialScore, getRanking, recalcularScore } from '../controllers/score.controller';

const router = Router();

router.use(requireAuth);

router.get('/ranking/empresa', getRanking);
router.get('/:idCliente', getScore);
router.get('/historial/:idCliente', getHistorialScore);
router.post('/recalcular/:idCliente', recalcularScore);

export default router;
