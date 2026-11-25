import 'dotenv/config';
import { sendEmail } from '../src/config/email';
import { emailTemplates } from '../src/config/email-templates';

const testEmail = async () => {
  const testEmailTo = process.env.TEST_EMAIL || process.env.EMAIL_USER;

  if (!testEmailTo) {
    console.error('[TEST] No TEST_EMAIL o EMAIL_USER configurado');
    process.exit(1);
  }

  console.log('[TEST] Enviando email de prueba a:', testEmailTo);

  const sent = await sendEmail({
    to: testEmailTo,
    subject: 'Email de Prueba - Business ERP',
    html: emailTemplates.otp('123456', 'Usuario Test'),
  });

  if (sent) {
    console.log('[TEST] Email enviado exitosamente. Revisa tu bandeja de entrada.');
  } else {
    console.log('[TEST] Error al enviar email. Revisa la configuración.');
  }

  process.exit(0);
};

testEmail();
