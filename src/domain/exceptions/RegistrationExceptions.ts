export class InvalidRegistrationPeriodException extends Error {
    constructor() {
        super('Registration period is invalid');
        this.name = 'InvalidRegistrationPeriodException';
    }
}
