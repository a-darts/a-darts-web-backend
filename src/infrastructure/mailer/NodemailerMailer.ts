import nodemailer from 'nodemailer';
import { IMailer } from '../../domain/ports/services/IMailer.js';
import { MailerSendException } from '../../domain/exceptions/MailerExceptions.js';

export class NodemailerMailer implements IMailer {
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
                <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb;">
                        
                        <!-- Encabezado / Branding -->
                        <div style="background-color: #111827; padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                                A-DARTS <span style="color: #A3E635;">APP</span>
                            </h1>
                        </div>

                        <!-- Contenido Principal -->
                        <div style="padding: 40px 32px; color: #374151; line-height: 1.6;">
                            <h2 style="margin-top: 0; margin-bottom: 16px; color: #111827; font-size: 20px; font-weight: 700;">
                                ¡Hola, ${alias}! 👋
                            </h2>
                            <p style="margin: 0 0 16px 0; font-size: 15px;">
                                Un administrador te ha invitado a formar parte de nuestra plataforma de dardos. Tu cuenta ya está lista para que empieces a registrar tus puntuaciones y competir.
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 15px;">
                                Para tu primer inicio de sesión seguro, utiliza la siguiente <strong>contraseña temporal</strong>. El sistema te solicitará cambiarla obligatoriamente nada más entrar:
                            </p>
                            
                            <!-- Contenedor del Password Destacado -->
                            <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #374151;">
                                <span style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 700; color: #A3E635; letter-spacing: 3px;">
                                    ${temporaryPassword}
                                </span>
                            </div>
                            
                            <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; font-style: italic;">
                                * Por seguridad, esta credencial es de un solo uso y expirará pronto.
                            </p>
                            
                            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                                <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                                    Si no has solicitado este registro o crees que se trata de un error, por favor ponte en contacto con el administrador del club.
                                </p>
                            </div>
                        </div>

                        <!-- Pie de página -->
                        <div style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                                © 2026 A-Darts App. Todos los derechos reservados.
                            </p>
                        </div>

                    </div>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error enviando el email de bienvenida:', error);
            throw new MailerSendException();
        }
    }

    public async sendForgotPasswordRecovery(to: string, alias: string, temporaryPassword: string): Promise<void> {
        const mailOptions = {
            from: `"A-Darts App" <${process.env.MAIL_USER}>`,
            to: to,
            subject: 'A-Darts: Recuperación de contraseña',
            html: `
                <div style="background-color: #f3f4f6; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                    <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e5e7eb;">
                        
                        <!-- Encabezado / Branding -->
                        <div style="background-color: #111827; padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                                A-DARTS <span style="color: #A3E635;">APP</span>
                            </h1>
                        </div>

                        <!-- Contenido Principal -->
                        <div style="padding: 40px 32px; color: #374151; line-height: 1.6;">
                            <h2 style="margin-top: 0; margin-bottom: 16px; color: #111827; font-size: 20px; font-weight: 700;">
                                ¡Hola, ${alias}! 👋
                            </h2>
                            <p style="margin: 0 0 16px 0; font-size: 15px;">
                                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en A-Darts.
                            </p>
                            <p style="margin: 0 0 24px 0; font-size: 15px;">
                                Para acceder de nuevo, utiliza la siguiente <strong>contraseña temporal</strong>. Por razones de seguridad, te pediremos que la cambies inmediatamente después de iniciar sesión:
                            </p>
                            
                            <!-- Contenedor del Password Destacado -->
                            <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; border: 1px solid #374151;">
                                <span style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 700; color: #A3E635; letter-spacing: 3px;">
                                    ${temporaryPassword}
                                </span>
                            </div>
                            
                            <p style="margin: 0 0 24px 0; font-size: 14px; color: #6b7280; font-style: italic;">
                                * Esta credencial es de un solo uso y expirará en poco tiempo.
                            </p>
                            
                            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px; margin-top: 32px;">
                                <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                                    Si no has solicitado recuperar tu contraseña, por favor ignora este correo o contacta con soporte si tienes dudas.
                                </p>
                            </div>
                        </div>

                        <!-- Pie de página -->
                        <div style="background-color: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                            <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                                © 2026 A-Darts App. Todos los derechos reservados.
                            </p>
                        </div>

                    </div>
                </div>
            `,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error enviando el email de recuperación de contraseña:', error);
            throw new MailerSendException();
        }
    }
}
