import '../src/config/load-env.js';
import { redis, redisAvailable } from '../src/config/redis.js';

const testRedis = async () => {
  console.log('[TEST] Probando conexión a Redis...');

  if (!redisAvailable || !redis) {
    console.error('[TEST] Redis no está disponible. Verifica REDIS_URL en .env');
    process.exit(1);
  }

  try {
    // Probar conexión
    redis.connect();

    redis.on('connect', () => {
      console.log('[TEST] Redis conectado exitosamente');
    });

    redis.on('error', (err) => {
      console.error('[TEST] Error de Redis:', err.message);
    });

    // Esperar conexión
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Probar SET y GET
    const testKey = 'test:connection';
    const testValue = 'OK - ' + new Date().toISOString();

    await redis.set(testKey, testValue, 'EX', 10);
    console.log('[TEST] SET ejecutado:', testKey, '=', testValue);

    const retrieved = await redis.get(testKey);
    console.log('[TEST] GET ejecutado:', retrieved);

    if (retrieved === testValue) {
      console.log('[TEST] Redis funciona correctamente');
    } else {
      console.log('[TEST] Error: los valores no coinciden');
    }

    // Probor INCR (para rate limiting)
    const incrKey = 'test:incr';
    await redis.del(incrKey);

    const val1 = await redis.incr(incrKey);
    console.log('[TEST] INCR #1:', val1);

    const val2 = await redis.incr(incrKey);
    console.log('[TEST] INCR #2:', val2);

    await redis.expire(incrKey, 5);
    const ttl = await redis.ttl(incrKey);
    console.log('[TEST] TTL:', ttl, 'segundos');

    await redis.disconnect();
    console.log('[TEST] Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('[TEST] Error:', error);
    process.exit(1);
  }
};

testRedis();
