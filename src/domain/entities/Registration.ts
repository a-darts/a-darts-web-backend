import {
    InvalidRegistrationPeriodException,
} from "../exceptions/RegistrationExceptions.js";
import {
    ParticipantNotRegisteredException,
    ParticipantAlreadyRegisteredException,
} from "../exceptions/ParticipantExceptions.js";

export enum RegistrationStatus {
    OPEN = 'OPEN',
    CLOSED = 'CLOSED',
}

export class Registration {
    private readonly hasCheckIn: boolean;
    private readonly status: RegistrationStatus;
    private readonly registrationPeriod: RegistrationPeriod;
    private readonly registeredParticipantsIds: string[];


    constructor(
        hasCheckIn: boolean,
        status: RegistrationStatus,
        registrationPeriod: RegistrationPeriod,
        registeredParticipantsIds: string[],
    ) {
        this.hasCheckIn = hasCheckIn;
        this.status = status;
        this.registrationPeriod = registrationPeriod;
        this.registeredParticipantsIds = [...registeredParticipantsIds];
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(): Registration {
        return new Registration(
            false,
            RegistrationStatus.CLOSED,
            new RegistrationPeriod(null, null),
            [],
        );
    }


    // --------------------------------------------------------------------
    // REGISTRATION STATUS MANAGEMENT
    // --------------------------------------------------------------------
    // Manual registration open
    public open(): Registration {
        return new Registration(
            this.hasCheckIn,
            RegistrationStatus.OPEN,
            new RegistrationPeriod(null, this.registrationPeriod.getEndsAt()),
            this.registeredParticipantsIds,
        );
    }

    // Manual registration close
    public close(): Registration {
        return new Registration(
            this.hasCheckIn,
            RegistrationStatus.CLOSED,
            new RegistrationPeriod(this.registrationPeriod.getStartsAt(), new Date()),
            this.registeredParticipantsIds,
        );
    }

    public schedule(open: Date | null, close: Date | null): Registration {
        return new Registration(
            this.hasCheckIn,
            this.status,
            new RegistrationPeriod(open, close),
            this.registeredParticipantsIds,
        );
    }

    public isOpen(): boolean {
        return this.status === RegistrationStatus.OPEN && this.registrationPeriod.isOpen();
    }


    // --------------------------------------------------------------------
    // REGISTRATION PARTICIPANTS MANAGEMENT
    // --------------------------------------------------------------------
    public registerParticipant(playerId: string): Registration {
        if (this.isParticipantRegistered(playerId)) {
            throw new ParticipantAlreadyRegisteredException();
        }

        return new Registration(
            this.hasCheckIn,
            this.status,
            this.registrationPeriod,
            [...this.registeredParticipantsIds, playerId],
        );
    }

    public unregisterParticipant(playerId: string): Registration {
        if (!this.isParticipantRegistered(playerId)) {
            throw new ParticipantNotRegisteredException();
        }

        const updatedParticipants = this.registeredParticipantsIds.filter(
            p => p !== playerId
        );

        return new Registration(
            this.hasCheckIn,
            this.status,
            this.registrationPeriod,
            updatedParticipants,
        );
    }

    public isParticipantRegistered(playerId: string): boolean {
        return this.registeredParticipantsIds.some(p => p === playerId);
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

    public getRegisteredParticipantsIds(): string[] {
        return [...this.registeredParticipantsIds];
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
    public isOpen(): boolean {
        const now = new Date();
        const afterStart = this.startsAt ? now >= this.startsAt : true;
        const beforeEnd = this.endsAt ? now <= this.endsAt : true;
        return afterStart && beforeEnd;
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
