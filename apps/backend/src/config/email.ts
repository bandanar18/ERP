import nodemailer from 'nodemailer';

let etherealAccount: { user: string; pass: string } | null = null;

const getEmailConfig = () => {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return null;
  }

  return {
    host: emailHost || 'smtp.gmail.com',
    port: parseInt(emailPort || '587'),
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  };
};

const createTransporter = async (): Promise<nodemailer.Transporter> => {
  const config = getEmailConfig();

  if (config) {
    return nodemailer.createTransport(config);
  }

  if (!etherealAccount) {
    etherealAccount = await nodemailer.createTestAccount();
  }

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: etherealAccount,
  });
};

let transporterInstance: nodemailer.Transporter | null = null;

export const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (!transporterInstance) {
    transporterInstance = await createTransporter();
  }
  return transporterInstance;
};

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> => {
  try {
    const transporter = await getTransporter();

    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'Business ERP'}" <${process.env.EMAIL_USER || 'test@ethereal.email'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    return true;
  } catch (error) {
    console.error('[Email] Error sending:', error);
    return false;
  }
};
