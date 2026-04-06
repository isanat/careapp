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

  const from = process.env.SMTP_FROM || `${APP_NAME} <noreply@seniorcare.pt>`;

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

// ==================== MARKETPLACE NOTIFICATIONS ====================

/**
 * Notify caregiver about new demand in their area
 */
export async function notifyCaregiverNewDemand(
  caregiverEmail: string,
  caregiverName: string,
  demand: {
    id: string;
    title: string;
    city: string;
    serviceTypes: string[];
  }
): Promise<boolean> {
  const servicesList = demand.serviceTypes.join(", ");

  return sendEmail({
    to: caregiverEmail,
    subject: `📢 Nova demanda em ${demand.city}!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb;">Olá ${caregiverName}!</h2>

        <p>Uma nova demanda foi criada perto de você em <strong>${demand.city}</strong>:</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
          <h3 style="margin-top: 0; color: #333;">${demand.title}</h3>
          <p style="margin: 10px 0;"><strong>Localidade:</strong> ${demand.city}</p>
          <p style="margin: 10px 0;"><strong>Serviços:</strong> ${servicesList}</p>
        </div>

        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/demands/${demand.id}"
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Ver Demanda & Propor
          </a>
        </p>

        <p style="margin-top: 40px; font-size: 12px; color: #666;">
          Você recebe este email porque é um cuidador ativo no ${APP_NAME}.
        </p>
      </div>
    `,
    text: `
Nova demanda em ${demand.city}: ${demand.title}
Serviços: ${servicesList}

Ver demanda: ${process.env.NEXT_PUBLIC_APP_URL}/app/demands/${demand.id}
    `.trim(),
  });
}

/**
 * Notify family about new proposal received
 */
export async function notifyFamilyNewProposal(
  familyEmail: string,
  familyName: string,
  demand: {
    id: string;
    title: string;
  },
  proposal: {
    caregiverName: string;
    message: string;
  }
): Promise<boolean> {
  return sendEmail({
    to: familyEmail,
    subject: `✓ Nova proposta para "${demand.title}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">Olá ${familyName}!</h2>

        <p><strong>${proposal.caregiverName}</strong> enviou uma proposta para sua demanda:</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
          <h3 style="margin-top: 0; color: #333;">${demand.title}</h3>
          <p style="color: #666; margin: 10px 0; font-style: italic;">"${proposal.message}"</p>
        </div>

        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/family/demands/${demand.id}"
             style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Ver Proposta & Responder
          </a>
        </p>

        <p style="margin-top: 40px; font-size: 12px; color: #666;">
          Você recebe este email porque uma proposta foi enviada para sua demanda.
        </p>
      </div>
    `,
    text: `
Nova proposta de ${proposal.caregiverName} para "${demand.title}"

Mensagem: "${proposal.message}"

Ver proposta: ${process.env.NEXT_PUBLIC_APP_URL}/app/family/demands/${demand.id}
    `.trim(),
  });
}

/**
 * Notify caregiver about accepted proposal
 */
export async function notifyCaregiverProposalAccepted(
  caregiverEmail: string,
  caregiverName: string,
  demand: {
    title: string;
  },
  family: {
    name: string;
  }
): Promise<boolean> {
  return sendEmail({
    to: caregiverEmail,
    subject: `🎉 Sua proposta foi aceita!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #16a34a;">Parabéns ${caregiverName}!</h2>

        <p><strong>${family.name}</strong> aceitou sua proposta para <strong>"${demand.title}"</strong>!</p>

        <p>Os próximos passos incluem formalizar o contrato e iniciar o trabalho. Você receberá mais informações em breve.</p>

        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/app/contracts"
             style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Ver Contrato
          </a>
        </p>

        <p style="margin-top: 40px; font-size: 12px; color: #666;">
          Você recebe este email porque sua proposta foi aceita.
        </p>
      </div>
    `,
    text: `
Sua proposta foi aceita!

${family.name} aceitou sua proposta para "${demand.title}"

Ver contrato: ${process.env.NEXT_PUBLIC_APP_URL}/app/contracts
    `.trim(),
  });
}
