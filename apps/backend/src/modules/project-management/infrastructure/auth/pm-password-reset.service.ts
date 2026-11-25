import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../../../prisma/prisma.js';
import { sendEmail } from '../../../../config/email.js';
import { emailTemplates } from '../../../../config/email-templates.js';
import { getPmFrontendOrigin } from '../../../../config/public-urls.js';

const TOKEN_EXPIRY_HOURS = 0.5; // 30 minutos

export class PmPasswordResetService {
  async requestReset(email: string): Promise<{ success: boolean; error?: string }> {
    // Buscar usuario (sin revelar si existe)
    const user = await prisma.pmModuleUser.findUnique({ where: { email } });

    if (!user || user.status !== 'ACTIVE') {
      // Retornar éxito para no revelar si el email existe
      return { success: true };
    }

    // Invalidar tokens anteriores
    await prisma.pmPasswordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generar token seguro
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.pmPasswordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Enviar email con link público del módulo (nunca localhost)
    const resetLink = `${getPmFrontendOrigin()}/project-management/reset-password?token=${token}`;
    const emailSent = await sendEmail({
      to: email,
      subject: 'Restablecer Contraseña',
      html: emailTemplates.passwordReset(resetLink, user.firstName ?? undefined, user.lastName ?? undefined),
    });

    if (!emailSent) {
      return {
        success: false,
        error: 'Error al enviar el email. Por favor intenta más tarde.',
      };
    }

    return { success: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    // Buscar token válido
    const resetToken = await prisma.pmPasswordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return {
        success: false,
        error: 'Token inválido.',
      };
    }

    if (resetToken.used) {
      return {
        success: false,
        error: 'Este token ya fue usado. Solicita un nuevo reset.',
      };
    }

    if (resetToken.expiresAt < new Date()) {
      return {
        success: false,
        error: 'Token expirado. Solicita un nuevo reset.',
      };
    }

    if (resetToken.user.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'Usuario inactivo.',
      };
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y marcar token como usado
    await prisma.$transaction([
      prisma.pmModuleUser.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      prisma.pmPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Enviar email de confirmación
    await sendEmail({
      to: resetToken.user.email,
      subject: 'Contraseña Cambiada',
      html: emailTemplates.passwordChanged(resetToken.user.firstName ?? undefined, resetToken.user.lastName ?? undefined),
    });

    return { success: true };
  }
}
