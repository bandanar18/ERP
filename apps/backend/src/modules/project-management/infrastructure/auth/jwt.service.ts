import jwt from 'jsonwebtoken';

export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    if (!process.env.PM_JWT_SECRET) {
      throw new Error('PM_JWT_SECRET is not set — fail-fast (arranque detenido)');
    }
    this.secret = process.env.PM_JWT_SECRET;
    this.expiresIn = process.env.PM_JWT_EXPIRES_IN || '8h';
  }

  sign(payload: { sub: string; email: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any });
  }

  verify(token: string): { sub: string; email: string } {
    return jwt.verify(token, this.secret) as { sub: string; email: string };
  }
}
