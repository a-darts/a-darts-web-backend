import nodemailer from 'nodemailer';
import { Mailer } from '../../domain/services/Mailer.js';
import { MailerSendTemporaryPasswordException } from '../../domain/exceptions/MailerExceptions.js';

export class NodemailerMailer implements Mailer {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD,
            },
            tls: {
                rejectUnauthorized: false // Omite la validación del certificado autofirmado
            }
        });
    }

    public async sendTemporaryPassword(to: string, alias: string, temporaryPassword: string): Promise<void> {
        const mailOptions = {
            from: `"A-Darts App" <${process.env.MAIL_USER}>`,
            to: to,
            subject: '¡Te han invitado a A-Darts! Tu contraseña temporal',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>¡Hola, ${alias}!</h2>
          <p>Un administrador ha creado tu cuenta en nuestra plataforma.</p>
          <p>Para poder acceder por primera vez, utiliza la siguiente contraseña temporal:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; letter-spacing: 2px;">
            ${temporaryPassword}
          </div>
          <p>Al iniciar sesión, el sistema te pedirá obligatoriamente que la cambies por una de tu elección.</p>
          <hr />
          <small>Este enlace y contraseña son de un solo uso.</small>
        </div>
      `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error enviando el email de bienvenida:', error);
            throw new MailerSendTemporaryPasswordException();
        }
    }
}
