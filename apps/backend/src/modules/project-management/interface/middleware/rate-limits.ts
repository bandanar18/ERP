import { rateLimit } from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 10,
  validate: { trustProxy: false },
  message: { error: 'Demasiados intentos, intenta más tarde' },
});

// Limitador laxo para la verificación de disponibilidad del nombre de usuario
// (el registro la consulta en vivo con debounce mientras se escribe).
export const usernameCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 60,
  validate: { trustProxy: false },
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
});
