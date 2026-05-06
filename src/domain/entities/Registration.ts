import { InvalidRegistrationPeriodException } from "../exceptions/RegistrationExceptions.js";

export enum RegistrationStatus {
    OPEN = 'open',
    CLOSED = 'closed',
}

export class Registration {
    private readonly hasCheckIn: boolean;
    private readonly status: RegistrationStatus;
    private readonly registrationPeriod: RegistrationPeriod;
    private readonly registratedParticipants: RegistratedParticipant[];


    constructor(
        hasCheckIn: boolean,
        status: RegistrationStatus,
        registrationPeriod: RegistrationPeriod,
        registratedParticipants: RegistratedParticipant[],
    ) {
        this.hasCheckIn = hasCheckIn;
        this.status = status;
        this.registrationPeriod = registrationPeriod;
        this.registratedParticipants = [...registratedParticipants];
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
            this.registratedParticipants,
        );
    }

    // Manual registration close
    public close(): Registration {
        return new Registration(
            this.hasCheckIn,
            RegistrationStatus.CLOSED,
            new RegistrationPeriod(this.registrationPeriod.getStartsAt(), new Date()),
            this.registratedParticipants,
        );
    }

    public schedule(open: Date | null, close: Date | null): Registration {
        return new Registration(
            this.hasCheckIn,
            this.status,
            new RegistrationPeriod(open, close),
            this.registratedParticipants,
        );
    }

    public canAcceptRegistrations(): boolean {
        return this.status === RegistrationStatus.OPEN && this.registrationPeriod.isOpen();
    }

    public registerParticipant(playerId: string): Registration {
        if (this.registratedParticipants.some(p => p.getPlayerId() === playerId)) {
            throw new Error('Player already registered');
        }

        const newParticipant = RegistratedParticipant.create(playerId);

        return new Registration(
            this.hasCheckIn,
            this.status,
            this.registrationPeriod,
            [...this.registratedParticipants, newParticipant],
        );
    }

    public unregisterPlayer(playerId: string): Registration {
        if (!this.registratedParticipants.some(p => p.getPlayerId() === playerId)) {
            throw new Error('Player is not registered in this tournament');
        }

        const updatedParticipants = this.registratedParticipants.filter(
            p => p.getPlayerId() !== playerId
        );

        return new Registration(
            this.hasCheckIn,
            this.status,
            this.registrationPeriod,
            updatedParticipants,
        );
    }

    public checkInPlayer(playerId: string): Registration {
        const participant = this.registratedParticipants.find(
            p => p.getPlayerId() === playerId
        );
        if (!participant) {
            throw new Error('Player is not registered in this tournament');
        }

        const checkedInParticipant = participant.doCheckIn();
        const updatedParticipants = this.registratedParticipants.map(p =>
            p.getPlayerId() === playerId ? checkedInParticipant : p
        );

        return new Registration(
            this.hasCheckIn,
            this.status,
            this.registrationPeriod,
            updatedParticipants,
        );
    }

    public undoCheckInPlayer(playerId: string): Registration {
        const participant = this.registratedParticipants.find(
            p => p.getPlayerId() === playerId
        );
        if (!participant) {
            throw new Error('Player is not registered in this tournament');
        }

        const uncheckedParticipant = participant.undoCheckIn();
        const updatedParticipants = this.registratedParticipants.map(p =>
            p.getPlayerId() === playerId ? uncheckedParticipant : p
        );

        return new Registration(
            this.hasCheckIn,
            this.status,
            this.registrationPeriod,
            updatedParticipants,
        );
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



export class RegistratedParticipant {
    private readonly playerId: string;
    private readonly registeredAt: Date;
    private readonly checkedInAt: Date | null;

    constructor(
        playerId: string,
        registeredAt: Date,
        checkedInAt: Date | null,
    ) {
        this.playerId = playerId;
        this.registeredAt = registeredAt;
        this.checkedInAt = checkedInAt;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        playerId: string,
    ): RegistratedParticipant {
        return new RegistratedParticipant(
            playerId,
            new Date(),
            null,
        );
    }


    // --------------------------------------------------------------------
    // CHECK IN METHODS
    // --------------------------------------------------------------------
    public doCheckIn(): RegistratedParticipant {
        if (this.checkedInAt) {
            throw new Error('Already checked in');
        }
        return new RegistratedParticipant(
            this.playerId,
            this.registeredAt,
            new Date(),
        );
    }

    public undoCheckIn(): RegistratedParticipant {
        if (!this.checkedInAt) {
            throw new Error('Not checked in');
        }
        return new RegistratedParticipant(
            this.playerId,
            this.registeredAt,
            null,
        );
    }

    public hasDoneCheckIn(): boolean {
        return this.checkedInAt !== null;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getPlayerId(): string {
        return this.playerId;
    }

    public getRegisteredAt(): Date {
        return this.registeredAt;
    }

    public getCheckedInAt(): Date | null {
        return this.checkedInAt;
    }
}
