import { Request, Response } from 'express';

export const getRoot = (_req: Request, res: Response): void => {
  res.json({
    message: 'Agent For You API',
    status: 'ok'
  });
};

export const getHealth = (_req: Request, res: Response): void => {
  res.json({ status: 'healthy' });
};
