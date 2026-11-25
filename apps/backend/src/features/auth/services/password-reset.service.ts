import { randomBytes } from 'crypto';
import { prisma } from '../../../config/database';
import { sendEmail } from '../../../config/email';
import { emailTemplates } from '../../../config/email-templates';
import { getAuthFrontendOrigin } from '../../../config/public-urls';
import * as bcrypt from 'bcryptjs';

const TOKEN_EXPIRY_HOURS = 0.5; // 30 minutos

export class PasswordResetService {
  async requestReset(email: string): Promise<{ success: boolean; error?: string }> {
    // Buscar usuario (sin revelar si existe)
    const user = await prisma.erpUser.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      // Retornar éxito para no revelar si el email existe
      return { success: true };
    }

    // Invalidar tokens anteriores
    await prisma.erpPasswordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generar token seguro
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.erpPasswordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Enviar email con link público (nunca localhost)
    const resetLink = `${getAuthFrontendOrigin()}/auth/reset-password?token=${token}`;
    const emailSent = await sendEmail({
      to: email,
      subject: 'Restablecer Contraseña',
      html: emailTemplates.passwordReset(resetLink, user.firstName, user.lastName),
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
    const resetToken = await prisma.erpPasswordResetToken.findUnique({
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

    if (!resetToken.user.isActive) {
      return {
        success: false,
        error: 'Usuario inactivo.',
      };
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y marcar token como usado
    await prisma.$transaction([
      prisma.erpUser.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      prisma.erpPasswordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Enviar email de confirmación
    await sendEmail({
      to: resetToken.user.email,
      subject: 'Contraseña Cambiada',
      html: emailTemplates.passwordChanged(resetToken.user.firstName, resetToken.user.lastName),
    });

    return { success: true };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; error?: string }> {
    const user = await prisma.erpUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        success: false,
        error: 'Usuario no encontrado.',
      };
    }

    // Verificar contraseña actual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Contraseña actual incorrecta.',
      };
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.erpUser.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true };
  }
}
