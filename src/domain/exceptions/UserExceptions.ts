export class UserNotFoundException extends Error {
    constructor() {
        super('User not found');
        this.name = 'UserNotFoundException';
    }
}

export class UserDeletedException extends Error {
    constructor() {
        super('User deleted');
        this.name = 'UserDeletedException';
    }
}

export class UserBlockedException extends Error {
    constructor() {
        super('User blocked');
        this.name = 'UserBlockedException';
    }
}

export class UserNotActiveException extends Error {
    constructor() {
        super('User not active');
        this.name = 'UserNotActiveException';
    }
}

export class EmailAlreadyInUseException extends Error {
    constructor() {
        super('Email already in use');
        this.name = 'EmailAlreadyInUseException';
    }
}

export class InvalidCredentialsException extends Error {
    constructor() {
        super('Invalid credentials');
        this.name = 'InvalidCredentialsException';
    }
}

export class InvalidPasswordException extends Error {
    constructor() {
        super('Invalid password');
        this.name = 'InvalidPasswordException';
    }
}

export class MissingRequiredUserFieldsException extends Error {
    constructor() {
        super('All fields are required');
        this.name = 'MissingRequiredUserFieldsException';
    }
}

export class InvalidUserFieldsException extends Error {
    constructor() {
        super('Invalid user fields');
        this.name = 'InvalidUserFieldsException';
    }
}
