import { Request, Response, NextFunction } from 'express';

interface RequestLog {
  timestamp: string;
  method: string;
  url: string;
  query: Record<string, unknown>;
  body: unknown;
  ip: string | undefined;
  userAgent: string | undefined;
  duration?: number;
  statusCode?: number;
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  const log: RequestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent')
  };

  // Log request
  console.log(`--> ${log.method} ${log.url}`);
  if (Object.keys(log.query).length > 0) {
    console.log(`    Query: ${JSON.stringify(log.query)}`);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`    Body: ${JSON.stringify(log.body)}`);
  }

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    log.duration = duration;
    log.statusCode = res.statusCode;

    const statusEmoji = res.statusCode >= 400 ? '!' : '<--';
    console.log(`${statusEmoji} ${log.method} ${log.url} ${res.statusCode} (${duration}ms)`);
  });

  next();
};
