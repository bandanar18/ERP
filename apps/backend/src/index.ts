import './config/load-env.js';
import { probeRedis } from './config/redis.js';

// Redis es OPCIONAL: se comprueba una sola vez al arrancar. Debe resolverse
// ANTES de montar las rutas, porque los rate limiters eligen su store
// (Redis vs. memoria) según redisAvailable al cargar los módulos.
await probeRedis();

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});