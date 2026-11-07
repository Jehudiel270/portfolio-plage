import nodemailer from 'nodemailer'
export interface SmtpConfig { host: string; port: number; secure: boolean; user: string; password: string; from: string }
export interface OutgoingMail { to: string; subject: string; text: string; replyTo?: string }

export const smtpIsConfigured = (smtp: SmtpConfig): boolean => Boolean(smtp.host && smtp.from)

/** Envoi SMTP via Nodemailer. Les identifiants proviennent exclusivement de l'environnement serveur. */
export async function sendMail(smtp: SmtpConfig, mail: OutgoingMail): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  })
  await transporter.sendMail({ from: smtp.from, to: mail.to, subject: mail.subject, text: mail.text, replyTo: mail.replyTo })
}
