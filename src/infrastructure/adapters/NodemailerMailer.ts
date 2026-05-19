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
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2>¡Te damos la bienvenida a A-Darts, ${alias}!</h2>
                <p>Nos alegra informarte que tu cuenta ya está lista para ser utilizada en nuestra plataforma.</p>
                <p>Para tu primer inicio de sesión seguro, el sistema ha generado una clave de acceso provisional. Podrás modificarla por una contraseña personal en cuanto accedas a tu perfil:</p>
                
                <div style="background: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; text-align: center; margin: 20px 0;">
                    <code style="font-size: 22px; font-weight: bold; color: #007bff; letter-spacing: 1px;">${temporaryPassword}</code>
                </div>
                
                <p>Si tienes cualquier duda o no has solicitado este registro, por favor ponte en contacto con el administrador.</p>
                <br />
                <p>El equipo de soporte de A-Darts.</p>
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
