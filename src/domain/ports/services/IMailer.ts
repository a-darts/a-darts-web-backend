export interface IMailer {
    sendTemporaryPassword(to: string, alias: string, temporaryPassword: string): Promise<void>;
    sendForgotPasswordRecovery(to: string, alias: string, temporaryPassword: string): Promise<void>;
}
