export class MailerSendTemporaryPasswordException extends Error {
    constructor() {
        super('Error while sending the temporary password');
        this.name = 'MailerSendTemporaryPasswordException';
    }
}
