import { prisma } from '../../../config/database';
import { sendEmail } from '../../../config/email';
import { emailTemplates } from '../../../config/email-templates';

const OTP_EXPIRY_SECONDS = 300; // 5 minutos
const OTP_LENGTH = 6;
const MAX_ATTEMPTS = 3;
const ATTEMPT_WINDOW_SECONDS = 900; // 15 minutos

const generateCode = (length: number): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};

export class OtpService {
  async generateOtp(email: string, userId?: string): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.erpUser.findUnique({ where: { email } });

    if (!user) {
      return { success: true };
    }

    // Si el email ya está verificado, no enviar OTP
    if (user.emailVerified) {
      return { success: true };
    }

    const effectiveUserId = userId || user.id;

    // Verificar rate limiting por intentos
    if (user.otpAttempts >= MAX_ATTEMPTS && user.lastOtpSentAt) {
      const timeSinceLastOtp = Date.now() - user.lastOtpSentAt.getTime();
      if (timeSinceLastOtp < ATTEMPT_WINDOW_SECONDS * 1000) {
        return {
          success: false,
          error: `Máximo ${MAX_ATTEMPTS} intentos alcanzados. Por favor espere 15 minutos.`,
        };
      }
    }

    // Generar OTP de 6 dígitos
    const code = generateCode(OTP_LENGTH);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    // Limpiar OTPs anteriores del usuario
    await prisma.erpOtpToken.deleteMany({
      where: { email, verified: false },
    });

    // Guardar en base de datos
    await prisma.erpOtpToken.create({
      data: {
        email,
        userId: effectiveUserId,
        code,
        expiresAt,
      },
    });

    // Actualizar datos del usuario
    await prisma.erpUser.update({
      where: { id: effectiveUserId },
      data: {
        otpExpiresAt: expiresAt,
        lastOtpSentAt: new Date(),
      },
    });

    // Enviar email
    const emailSent = await sendEmail({
      to: email,
      subject: 'Código de Verificación',
      html: emailTemplates.otp(code, user.firstName, user.lastName),
    });

    if (!emailSent) {
      return {
        success: false,
        error: 'Error al enviar el email. Por favor intenta más tarde.',
      };
    }

    return { success: true };
  }

  async verifyOtp(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.erpUser.findUnique({ where: { email } });

    if (!user) {
      return {
        success: false,
        error: 'Código inválido o expirado.',
      };
    }

    // Buscar OTP en base de datos (no expirado)
    const otpRecord = await prisma.erpOtpToken.findFirst({
      where: {
        email,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      await this.recordFailedAttempt(email);
      return {
        success: false,
        error: 'Código inválido o expirado.',
      };
    }

    // Verificar que el código coincida
    if (otpRecord.code !== code) {
      await this.recordFailedAttempt(email);
      return {
        success: false,
        error: 'Código inválido.',
      };
    }

    // Eliminar el OTP usado
    await prisma.erpOtpToken.delete({
      where: { id: otpRecord.id },
    });

    // Reset intentos del usuario y marcar email como verificado
    await prisma.erpUser.update({
      where: { email },
      data: {
        otpSecret: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        lastOtpSentAt: null,
        emailVerified: true,
      },
    });

    return { success: true };
  }

  private async recordFailedAttempt(email: string): Promise<void> {
    const user = await prisma.erpUser.findUnique({ where: { email } });
    if (user) {
      const newAttempts = user.otpAttempts + 1;
      await prisma.erpUser.update({
        where: { email },
        data: {
          otpAttempts: newAttempts,
          lastOtpSentAt: newAttempts === 1 ? new Date() : user.lastOtpSentAt,
        },
      });
    }
  }
}
