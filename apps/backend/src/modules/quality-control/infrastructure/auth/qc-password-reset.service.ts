import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../../../../prisma/prisma.js';
import { sendEmail } from '../../../../config/email.js';
import { emailTemplates } from '../../../../config/email-templates.js';
import { getQcFrontendOrigin } from '../../../../config/public-urls.js';

const TOKEN_EXPIRY_HOURS = 0.5; // 30 minutos

/**
 * Servicio de restablecimiento de contraseña del módulo Quality Control.
 * Patrón idéntico a PmPasswordResetService pero sobre las tablas qc_*
 * (qc_users, qc_password_reset_tokens) — el módulo QC es 100% autocontenido.
 */
export class QcPasswordResetService {
  async requestReset(email: string): Promise<{ success: boolean; error?: string }> {
    // Buscar usuario (sin revelar si existe)
    const user = await prisma.qcUser.findUnique({ where: { email } });

    if (!user || user.status !== 'ACTIVE') {
      // Retornar éxito para no revelar si el email existe
      return { success: true };
    }

    // Invalidar tokens anteriores
    await prisma.qcPasswordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generar token seguro
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.qcPasswordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Enviar email con link público del módulo (nunca localhost)
    const resetLink = `${getQcFrontendOrigin()}/quality-control/reset-password?token=${token}`;
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
    const resetToken = await prisma.qcPasswordResetToken.findUnique({
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
      prisma.qcUser.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      prisma.qcPasswordResetToken.update({
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
