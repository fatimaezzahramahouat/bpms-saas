import nodemailer from "nodemailer";

/**
 * Mail Service
 * 
 * Handles sending emails for password recovery, notifications, etc.
 * Uses a mock logger if SMTP credentials are not provided.
 */

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@nexflow.com";

const transporter = (SMTP_HOST && SMTP_USER && SMTP_PASS)
  ? nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })
  : null;

export const mailService = {
  /**
   * Send a password reset email
   */
  async sendResetPasswordEmail(to: string, resetLink: string) {
    const subject = "Réinitialisation de votre mot de passe - NexFlow";
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">NexFlow</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte NexFlow.</p>
        <p>Veuillez cliquer sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable pendant 1 heure.</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Réinitialiser mon mot de passe</a>
        </div>
        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="font-size: 12px; color: #6b7280;">NexFlow - Plateforme de gestion des processus métier</p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
        console.log(`Email sent to ${to}`);
      } catch (error) {
        console.error("Error sending email:", error);
      }
    } else {
      console.log("-----------------------------------------");
      console.log(`MOCK EMAIL SENT TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`LINK: ${resetLink}`);
      console.log("-----------------------------------------");
    }
  },

  /**
   * Send a generic email
   */
  async sendGenericEmail(to: string, subject: string, body: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-top: 0;">NexFlow Notification</h2>
        <div style="color: #374151; line-height: 1.6;">
          ${body}
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 11px; color: #6b7280; text-align: center;">NexFlow - Automated Workflow Service</p>
      </div>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({ from: FROM_EMAIL, to, subject, html });
        console.log(`[MailService] Generic email sent to ${to}`);
      } catch (error) {
        console.error("[MailService] Error sending email:", error);
      }
    } else {
      console.log("-----------------------------------------");
      console.log(`[MOCK EMAIL SERVICE]`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY: ${body}`);
      console.log("-----------------------------------------");
    }
  },
};
