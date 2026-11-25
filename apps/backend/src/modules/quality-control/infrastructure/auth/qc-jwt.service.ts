import jwt from 'jsonwebtoken';

export class QcJwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    if (!process.env.QC_JWT_SECRET) {
      throw new Error('QC_JWT_SECRET is not set — fail-fast (arranque detenido)');
    }
    this.secret = process.env.QC_JWT_SECRET;
    this.expiresIn = process.env.QC_JWT_EXPIRES_IN || '8h';
  }

  sign(payload: { sub: string; email: string }): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any });
  }

  verify(token: string): { sub: string; email: string } {
    return jwt.verify(token, this.secret) as { sub: string; email: string };
  }
}
