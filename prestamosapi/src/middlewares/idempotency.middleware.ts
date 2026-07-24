import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';

interface CachedResponse {
  statusCode: number;
  body: any;
  timestamp: number;
  status: 'processing' | 'completed';
}

const idempotencyCache = new Map<string, CachedResponse>();

// Limpiar claves expiradas cada 5 minutos (TTL de 3 minutos por clave)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyCache.entries()) {
    if (now - value.timestamp > 3 * 60 * 1000) {
      idempotencyCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const idempotencyMiddleware = (req: any, res: Response, next: NextFunction) => {
  const method = req.method.toUpperCase();

  // Solo aplicar idempotencia a solicitudes de escritura/mutación
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const rawKey = req.headers['x-idempotency-key'] || req.headers['idempotency-key'];
  let idempotencyKey: string;

  if (rawKey && typeof rawKey === 'string' && rawKey.trim() !== '') {
    idempotencyKey = `header:${rawKey.trim()}`;
  } else {
    // Si la solicitud no envió cabecera, generamos una clave determinista basada en el usuario + método + ruta + hash del cuerpo
    const userId = req.user?.IdUsuario || req.user?.IdEmpresa || 'anon';
    const bodyString = JSON.stringify(req.body || {});
    const hash = crypto.createHash('sha256').update(`${userId}:${method}:${req.originalUrl}:${bodyString}`).digest('hex');
    idempotencyKey = `auto:${hash}`;
  }

  const cached = idempotencyCache.get(idempotencyKey);

  if (cached) {
    if (cached.status === 'processing') {
      logger.warn(`⚠️ Petición duplicada interceptada (En proceso): ${req.method} ${req.originalUrl}`);
      return res.status(409).json({
        success: false,
        error: 'Solicitud duplicada detectada. La operación ya está siendo procesada, por favor espera.'
      });
    }

    if (cached.status === 'completed') {
      logger.info(`🔁 Petición duplicada respondida desde caché de Idempotencia: ${req.method} ${req.originalUrl}`);
      return res.status(cached.statusCode).json(cached.body);
    }
  }

  // Marcar como en proceso
  idempotencyCache.set(idempotencyKey, {
    statusCode: 200,
    body: null,
    timestamp: Date.now(),
    status: 'processing'
  });

  // Interceptar la respuesta JSON para guardar el resultado final
  const originalJson = res.json.bind(res);
  res.json = (body: any): Response => {
    idempotencyCache.set(idempotencyKey, {
      statusCode: res.statusCode,
      body,
      timestamp: Date.now(),
      status: 'completed'
    });
    return originalJson(body);
  };

  next();
};
