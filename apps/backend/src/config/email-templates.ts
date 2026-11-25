// Helper para combinar firstName y lastName
const fullName = (firstName: string = '', lastName: string = ''): string => {
  if (firstName && lastName) return `${firstName} ${lastName}`;
  return firstName || lastName || '';
};

export const emailTemplates = {
  otp: (otp: string, firstName: string = '', lastName: string = '') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Codigo de Verificacion</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; margin: 0 0 20px;">Verificacion de Correo</h1>
          ${firstName || lastName ? `<p style="color: #666; margin: 0 0 20px;">Hola ${fullName(firstName, lastName)},</p>` : ''}
          <p style="color: #666; margin: 0 0 20px;">Tu codigo de verificacion es:</p>
          <div style="background: #f0f0f0; padding: 15px; text-align: center; border-radius: 4px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
          </div>
          <p style="color: #666; margin: 0 0 10px;">Este codigo expira en <strong>5 minutos</strong>.</p>
          <p style="color: #999; font-size: 14px; margin: 20px 0 0;">Si no solicitaste este codigo, ignora este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordReset: (resetLink: string, firstName: string = '', lastName: string = '') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Restablecer Contrasena</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; margin: 0 0 20px;">Restablecer Contrasena</h1>
          ${firstName || lastName ? `<p style="color: #666; margin: 0 0 20px;">Hola ${fullName(firstName, lastName)},</p>` : ''}
          <p style="color: #666; margin: 0 0 20px;">Recibimos una solicitud para restablecer tu contrasena. Haz clic en el siguiente enlace:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Restablecer Contrasena</a>
          </div>
          <p style="color: #666; margin: 0 0 10px;">Este enlace expira en <strong>30 minutos</strong>.</p>
          <p style="color: #999; font-size: 14px; margin: 20px 0 0;">Si no solicitaste restablecer tu contrasena, ignora este correo.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  passwordChanged: (firstName: string = '', lastName: string = '') => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrasena Cambiada</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; margin: 0 0 20px;">Contrasena Cambiada</h1>
          ${firstName || lastName ? `<p style="color: #666; margin: 0 0 20px;">Hola ${fullName(firstName, lastName)},</p>` : ''}
          <p style="color: #666; margin: 0 0 20px;">Tu contrasena ha sido cambiada exitosamente.</p>
          <p style="color: #666; margin: 0 0 10px;">Si no realizaste este cambio, contacta a soporte inmediatamente.</p>
        </div>
      </div>
    </body>
    </html>
  `,

  userAssigned: (firstName: string = '', lastName: string = '', roleName?: string, companyName?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cuenta Activada - Business ERP</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #22c55e; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: white; font-size: 28px;">✓</span>
            </div>
            <h1 style="color: #111; margin: 0; font-size: 24px;">¡Tu cuenta esta lista!</h1>
          </div>
          ${firstName || lastName ? `<p style="color: #555; margin: 0 0 20px;">Hola <strong>${fullName(firstName, lastName)}</strong>,</p>` : ''}
          <p style="color: #555; margin: 0 0 24px;">
            Un administrador ha actualizado tu perfil en el sistema <strong>Business ERP</strong>.
            Ya podes ingresar con tus credenciales habituales.
          </p>
          ${roleName ? `
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
            <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: bold;">ROL ASIGNADO</p>
            <p style="margin: 6px 0 0; color: #111; font-size: 18px; text-transform: capitalize;">${roleName}</p>
          </div>` : ''}
          ${companyName ? `
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #1d4ed8; font-size: 14px; font-weight: bold;">EMPRESA VINCULADA</p>
            <p style="margin: 6px 0 0; color: #111; font-size: 18px;">${companyName}</p>
          </div>` : ''}
          <p style="color: #999; font-size: 13px; margin: 24px 0 0; border-top: 1px solid #eee; padding-top: 16px;">
            Si crees que esto es un error o no reconces esta cuenta, contacta a soporte de inmediato.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  roleAssigned: (firstName: string = '', lastName: string = '', roleName?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rol Asignado - Business ERP</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #22c55e; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: white; font-size: 28px;">✓</span>
            </div>
            <h1 style="color: #111; margin: 0; font-size: 24px;">Rol Asignado</h1>
          </div>
          ${firstName || lastName ? `<p style="color: #555; margin: 0 0 20px;">Hola <strong>${fullName(firstName, lastName)}</strong>,</p>` : ''}
          <p style="color: #555; margin: 0 0 24px;">
            Un administrador te ha asignado un rol en el sistema <strong>Business ERP</strong>.
            Ya podes ingresar con tus credenciales habituales.
          </p>
          ${roleName ? `
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
            <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: bold;">TU ROL</p>
            <p style="margin: 6px 0 0; color: #111; font-size: 18px; text-transform: capitalize;">${roleName}</p>
          </div>` : ''}
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: bold;">IMPORTANTE</p>
            <p style="margin: 6px 0 0; color: #111; font-size: 14px;">
              La empresa aun no ha sido asignada (opcional). Contacta al administrador si necesitas una.
            </p>
          </div>
          <p style="color: #999; font-size: 13px; margin: 24px 0 0; border-top: 1px solid #eee; padding-top: 16px;">
            Si crees que esto es un error, contacta a soporte.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,

  companyAssigned: (firstName: string = '', lastName: string = '', roleName: string, companyName?: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Empresa Asignada - Business ERP</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: #3b82f6; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
              <span style="color: white; font-size: 28px;">🏢</span>
            </div>
            <h1 style="color: #111; margin: 0; font-size: 24px;">Empresa Asignada</h1>
          </div>
          ${firstName || lastName ? `<p style="color: #555; margin: 0 0 20px;">Hola <strong>${fullName(firstName, lastName)}</strong>,</p>` : ''}
          <p style="color: #555; margin: 0 0 24px;">
            Un administrador te ha asignado a una empresa en el sistema <strong>Business ERP</strong>.
          </p>
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
            <p style="margin: 0; color: #1d4ed8; font-size: 14px; font-weight: bold;">EMPRESA</p>
            <p style="margin: 6px 0 0; color: #111; font-size: 18px;">${companyName}</p>
          </div>
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
            <p style="margin: 0; color: #15803d; font-size: 14px; font-weight: bold;">TU ROL</p>
            <p style="margin: 6px 0 0; color: #111; font-size: 18px; text-transform: capitalize;">${roleName}</p>
          </div>
          <p style="color: #999; font-size: 13px; margin: 24px 0 0; border-top: 1px solid #eee; padding-top: 16px;">
            Si crees que esto es un error, contacta a soporte.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
};
