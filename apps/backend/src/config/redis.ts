import Redis from 'ioredis';

class RedisClient {
  private static instance: Redis | null = null;

  static getInstance(): Redis | null {
    if (!this.instance) {
      const redisUrl = process.env.REDIS_URL;

      if (redisUrl) {
        this.instance = new Redis(redisUrl, {
          // Fast-fail: si Redis no responde, los comandos fallan rapido en vez
          // de encolarse/colgar las requests (rate limiters con fail-open).
          maxRetriesPerRequest: 1,
          connectTimeout: 1500,
          enableOfflineQueue: false,
          retryStrategy: (times) => Math.min(times * 100, 3000),
          lazyConnect: true,
        });

        this.instance.on('error', (err) => {
          console.error('[Redis] Error:', err.message);
        });

        this.instance.on('connect', () => {
          // Redis connected
        });
      } else {
        console.warn('[Redis] REDIS_URL not set, running without cache');
      }
    }

    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit();
      this.instance = null;
    }
  }
}

export const redis = RedisClient.getInstance();

// Redis es OPCIONAL. Esta bandera refleja la disponibilidad REAL (no solo la
// presencia de REDIS_URL): se resuelve con probeRedis() al arrancar, ANTES de
// montar las rutas, para que los rate limiters elijan entre el store de Redis
// y el fallback en memoria.
export let redisAvailable = false;

/**
 * Comprueba si Redis responde. Se ejecuta una sola vez al arrancar el servidor.
 * - Redis configurado y disponible -> stores de Redis (rate limiting compartido)
 * - Redis no configurado o caído      -> fallback en memoria (todo sigue funcionando)
 */
export async function probeRedis(): Promise<boolean> {
  if (!redis) {
    console.warn('[Redis] REDIS_URL no configurado — usando fallback en memoria');
    return false;
  }

  try {
    await Promise.race([
      redis.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
    ]);
    redisAvailable = true;
    console.log('[Redis] Conectado — rate limiting con store de Redis');
    return true;
  } catch {
    redisAvailable = false;
    // Detiene el bucle de reconexión en background para no generar spam de errores
    redis.disconnect();
    console.warn('[Redis] No disponible — rate limiting con fallback en memoria');
    return false;
  }
}
