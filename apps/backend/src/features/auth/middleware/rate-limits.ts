import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request } from 'express';
import { redis, redisAvailable } from '../../../config/redis';

/**
 * Obtiene la IP real del cliente, funcionando tanto en:
 * - Desarrollo local (Vite proxy)
 * - Producción (Railway, nginx, Cloudflare)
 *
 * Express con trust proxy: true pobla req.ip con la IP correcta
 * del header X-Forwarded-For más a la izquierda (no la del proxy)
 */
const getClientIp = (req: Request): string => {
  // Express ya hace el parsing correcto con trust proxy: true
  return req.ip || 'unknown';
};

const createRedisStore = (prefix: string) => {
  if (!redisAvailable || !redis) return undefined;

  return new RedisStore({
    prefix: `rl:${prefix}`,
    sendCommand: async (...args: any[]) => {
      const client = redis;
      if (!client) throw new Error('Redis client not available');
      const result = await (client.call as any)(...args);
      return result as any;
    },
  } as any);
};

// Configuración base común para todos los rate limiters
const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  // Usar la IP real del cliente (funciona en Railway y dev local)
  keyGenerator: (req: Request) => getClientIp(req),
  // Fail-open: si el store de Redis falla (p. ej. Redis caído en dev), la
  // petición continúa en lugar de romper el login. El rate limiting vuelve
  // a funcionar automáticamente cuando Redis se recupera.
  passOnStoreError: true,
};

// Rate limiter específico para OTP (muy estricto)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: 'Máximo 5 intentos de OTP alcanzados. Por favor espere 15 minutos.',
  store: createRedisStore('otp'),
  ...baseConfig,
});

// Rate limiter para login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: 'Máximo 10 intentos de login alcanzados. Por favor espere 15 minutos.',
  store: createRedisStore('login'),
  ...baseConfig,
});

// Rate limiter para registro
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo 5 registros por hora
  message: 'Máximo 5 registros por hora alcanzados. Por favor espere.',
  store: createRedisStore('register'),
  ...baseConfig,
});

// Rate limiter para reset de contraseña
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3,
  message: 'Máximo 3 solicitudes de reset por hora. Por favor espere.',
  store: createRedisStore('reset'),
  ...baseConfig,
});

// Rate limiter general para la API
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Máximo 100 solicitudes por 15 minutos.',
  ...baseConfig,
});
