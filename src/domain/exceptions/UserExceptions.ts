export class UserNotFoundException extends Error {
    constructor() {
        super('Usuario no encontrado');
        this.name = 'UserNotFoundException';
    }
}

export class UserDeletedException extends Error {
    constructor() {
        super('Usuario eliminado');
        this.name = 'UserDeletedException';
    }
}

export class UserBlockedException extends Error {
    constructor() {
        super('Usuario bloqueado');
        this.name = 'UserBlockedException';
    }
}

export class UserNotActiveException extends Error {
    constructor() {
        super('Usuario no activo');
        this.name = 'UserNotActiveException';
    }
}

export class EmailAlreadyInUseException extends Error {
    constructor() {
        super('Correo ya en uso');
        this.name = 'EmailAlreadyInUseException';
    }
}

export class InvalidUserFieldException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidUserFieldException';
    }
}

export class InvalidCredentialsException extends Error {
    constructor() {
        super('Credenciales inválidas');
        this.name = 'InvalidCredentialsException';
    }
}

export class InvalidPasswordException extends Error {
    constructor() {
        super('Contraseña inválida');
        this.name = 'InvalidPasswordException';
    }
}
