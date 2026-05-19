export interface Mailer {
    sendTemporaryPassword(to: string, alias: string, temporaryPassword: string): Promise<void>;
}
