import { NextRequest, NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations/schemas";
import { sendEmail } from "@/lib/services/email";
import { APP_NAME } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = parsed.data;

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    if (!supportEmail) {
      console.error("[Contact] No SUPPORT_EMAIL or SMTP_USER configured");
      return NextResponse.json(
        { error: "Contact form is not configured" },
        { status: 503 },
      );
    }

    const sent = await sendEmail({
      to: supportEmail,
      subject: `[${APP_NAME} Contato] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">${APP_NAME} - Mensagem de Contato</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Nome:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Email:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Assunto:</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${subject}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `,
      text: `Nome: ${name}\nEmail: ${email}\nAssunto: ${subject}\n\nMensagem:\n${message}`,
    });

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Error in contact form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
