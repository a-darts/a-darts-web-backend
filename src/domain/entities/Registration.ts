import {
    CheckInAlreadyDisabledException,
    CheckInAlreadyEnabledException,
    InvalidRegistrationPeriodException,
    RegistrationAlreadyClosedException,
    RegistrationAlreadyOpenException,
} from "../exceptions/RegistrationExceptions.js";

export enum RegistrationStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
}

export class Registration {
    private readonly hasCheckIn: boolean;
    private readonly status: RegistrationStatus;
    private readonly registrationPeriod: RegistrationPeriod;


    constructor(
        hasCheckIn: boolean,
        status: RegistrationStatus,
        registrationPeriod: RegistrationPeriod,
    ) {
        this.hasCheckIn = hasCheckIn;
        this.status = status;
        this.registrationPeriod = registrationPeriod;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(): Registration {
        return new Registration(
            false,
            RegistrationStatus.CLOSED,
            new RegistrationPeriod(null, null),
        );
    }


    // --------------------------------------------------------------------
    // REGISTRATION STATUS MANAGEMENT
    // --------------------------------------------------------------------
    // Manual registration open
    public open(): Registration {
        if (this.status === RegistrationStatus.OPEN) {
            throw new RegistrationAlreadyOpenException();
        }

        return new Registration(
            this.hasCheckIn,
            RegistrationStatus.OPEN,
            this.registrationPeriod,
        );
    }

    // Manual registration close
    public close(): Registration {
        if (this.status === RegistrationStatus.CLOSED) {
            throw new RegistrationAlreadyClosedException();
        }

        return new Registration(
            this.hasCheckIn,
            RegistrationStatus.CLOSED,
            this.registrationPeriod,
        );
    }

    public schedule(open: Date | null, close: Date | null): Registration {
        return new Registration(
            this.hasCheckIn,
            this.status,
            new RegistrationPeriod(open, close),
        );
    }


    public enableCheckIn(): Registration {
        if (this.hasCheckIn === true) {
            throw new CheckInAlreadyEnabledException();
        }

        return new Registration(
            true,
            this.status,
            this.registrationPeriod,
        );
    }

    public disableCheckIn(): Registration {
        if (this.hasCheckIn === false) {
            throw new CheckInAlreadyDisabledException();
        }

        return new Registration(
            false,
            this.status,
            this.registrationPeriod,
        );
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    public isOpen(): boolean {
        return this.status === RegistrationStatus.OPEN;
    }

    public isClosed(): boolean {
        return this.status === RegistrationStatus.CLOSED;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getHasCheckIn(): boolean {
        return this.hasCheckIn;
    }

    public getStatus(): RegistrationStatus {
        return this.status;
    }

    public getRegistrationPeriod(): RegistrationPeriod {
        return this.registrationPeriod;
    }
}


export class RegistrationPeriod {
    private readonly startsAt: Date | null;
    private readonly endsAt: Date | null;


    constructor(
        startsAt: Date | null,
        endsAt: Date | null,
    ) {
        if (startsAt && endsAt && endsAt <= startsAt) {
            throw new InvalidRegistrationPeriodException();
        }

        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    public hasSchedule(): boolean {
        return this.startsAt !== null || this.endsAt !== null;
    }

    public isOpen(): boolean {
        const now = new Date();
        const afterStart = this.startsAt ? now >= this.startsAt : true;
        const beforeEnd = this.endsAt ? now <= this.endsAt : true;
        return afterStart && beforeEnd;
    }

    public isClosed(): boolean {
        return !this.isOpen();
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getStartsAt(): Date | null {
        return this.startsAt;
    }

    public getEndsAt(): Date | null {
        return this.endsAt;
    }
}
