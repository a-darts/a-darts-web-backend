export class UserNotFoundException extends Error {
    constructor() {
        super('User not found');
        this.name = 'UserNotFoundException';
    }
}

export class UserAlreadyActiveException extends Error {
    constructor() {
        super('User already active');
        this.name = 'UserAlreadyActiveException';
    }
}

export class UserNotInactiveException extends Error {
    constructor() {
        super('User not inactive');
        this.name = 'UserNotInactiveException';
    }
}

export class UserInactiveException extends Error {
    constructor() {
        super('User inactive');
        this.name = 'UserInactiveException';
    }
}

export class UserDeletedException extends Error {
    constructor() {
        super('User deleted');
        this.name = 'UserDeletedException';
    }
}

export class UserAlreadyDeletedException extends Error {
    constructor() {
        super('User already deleted');
        this.name = 'UserAlreadyDeletedException';
    }
}

export class UserNotDeletedException extends Error {
    constructor() {
        super('User not deleted');
        this.name = 'UserNotDeletedException';
    }
}

export class UserBlockedException extends Error {
    constructor() {
        super('User blocked');
        this.name = 'UserBlockedException';
    }
}

export class UserAlreadyBlockedException extends Error {
    constructor() {
        super('User already blocked');
        this.name = 'UserAlreadyBlockedException';
    }
}

export class UserNotBlockedException extends Error {
    constructor() {
        super('User not blocked');
        this.name = 'UserNotBlockedException';
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
