import { Request, Response } from 'express';
import { 
  getScoreService, 
  getHistorialScoreService, 
  getRankingService, 
  recalcularScoreService 
} from '../services/score.service';
import { logger } from '../utils/logger';

export const getScore = async (req: any, res: Response): Promise<void> => {
  try {
    const { idCliente } = req.params;
    const idEmpresa = req.user.IdEmpresa;

    const data = await getScoreService(idCliente, idEmpresa);
    res.json({ data });
  } catch (error: any) {
    logger.error('Error en getScore:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

export const getHistorialScore = async (req: any, res: Response): Promise<void> => {
  try {
    const { idCliente } = req.params;
    const idEmpresa = req.user.IdEmpresa;

    const data = await getHistorialScoreService(idCliente, idEmpresa);
    res.json({ data });
  } catch (error: any) {
    logger.error('Error en getHistorialScore:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

export const getRanking = async (req: any, res: Response): Promise<void> => {
  try {
    const idEmpresa = req.user.IdEmpresa;

    const data = await getRankingService(idEmpresa);
    res.json({ data });
  } catch (error: any) {
    logger.error('Error en getRanking:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};

export const recalcularScore = async (req: any, res: Response): Promise<void> => {
  try {
    const { idCliente } = req.params;
    const idEmpresa = req.user.IdEmpresa;

    const data = await recalcularScoreService(idCliente, idEmpresa);
    res.json({ data, message: 'Score recalculado con éxito' });
  } catch (error: any) {
    logger.error('Error en recalcularScore:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
};
