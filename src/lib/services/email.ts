import nodemailer from "nodemailer";
import { APP_NAME } from "@/lib/constants";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured — emails will not be sent");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: { user, pass },
  });

  return transporter;
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) return false;

  const from = process.env.SMTP_FROM || `${APP_NAME} <noreply@idosolink.pt>`;

  await transport.sendMail({ from, ...options });
  return true;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<boolean> {
  return sendEmail({
    to: email,
    subject: `Redefinir senha - ${APP_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">${APP_NAME} - Redefinir Senha</h2>
        <p>Recebeu este email porque solicitou a redefinição da sua senha.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}"
           style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Redefinir Senha
        </a>
        <p style="color: #6b7280; font-size: 14px;">
          Este link expira em 1 hora. Se não solicitou esta alteração, ignore este email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">${APP_NAME} - Cuidado de Qualidade para quem ama</p>
      </div>
    `,
    text: `Redefinir senha ${APP_NAME}: ${resetUrl}\n\nEste link expira em 1 hora.`,
  });
}
