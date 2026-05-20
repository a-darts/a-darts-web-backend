export class MailerSendException extends Error {
    constructor() {
        super('Error while sending the email');
        this.name = 'MailerSendException';
    }
}
