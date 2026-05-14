import { ByeParticipant } from "./Participant.js";
import type { IParticipant } from "./Participant.js";


export enum BracketStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
}

export class Bracket {
    private readonly id: string;
    private status: BracketStatus;

    private readonly positions: BracketPosition[];

    private readonly tournamentId: string;

    constructor(
        id: string,
        status: BracketStatus,
        positions: BracketPosition[],
        tournamentId: string,
    ) {
        this.id = id;
        this.status = status;
        this.positions = [...positions];
        this.tournamentId = tournamentId;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        tournamentId: string,
        participants: IParticipant[],
    ): Bracket {
        const totalParticipants = participants.length;
        const bracketSize = this.calculatePowerOfTwo(totalParticipants);

        // Lista de participantes reales + byes
        const fullParticipantList: IParticipant[] = [...participants];
        const numByes = bracketSize - totalParticipants;

        // Añadimos los byes a la lista
        for (let i = 0; i < numByes; i++) {
            fullParticipantList.push(ByeParticipant.create());
        }

        // Ordenamos los participantes y los byes ()
        const interleavedParticipants = this.distributePositions(fullParticipantList);

        // Mapeamos la lista de participantes a posiciones del cuadrante
        const positions = interleavedParticipants.map((participant, index) =>
            BracketPosition.create(participant, index + 1)
        );

        return new Bracket(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            BracketStatus.DRAFT,
            positions,
            tournamentId,
        );
    }


    /**
     * Calcula la potencia de 2 más cercana (hacia arriba)
     * Ejemplo: 5 participantes -> 8 posiciones.
     */
    private static calculatePowerOfTwo(n: number): number {
        if (n <= 2) return 2;
        return Math.pow(2, Math.ceil(Math.log2(n)));
    }


    /**
     * Intercala participantes y Byes.
     * (Standard Tournament Seeding)
     */
    private static distributePositions(items: IParticipant[]): IParticipant[] {
        let order = [0];
        const size = items.length;

        while (order.length < size) {
            const nextOrder = [];
            for (let i = 0; i < order.length; i++) {
                nextOrder.push(order[i]);
                nextOrder.push(order.length * 2 - 1 - order[i]);
            }
            order = nextOrder;
        }

        return order.map(index => items[index]);
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------    
    public getId(): string {
        return this.id;
    }

    public getStatus(): BracketStatus {
        return this.status;
    }

    public getPositions(): BracketPosition[] {
        return this.positions;
    }

    public getTournamentId(): string {
        return this.tournamentId;
    }


    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    public static rehydrate(data: {
        id: string;
        status: BracketStatus;
        tournamentId: string;
        positions: BracketPosition[];
    }): Bracket {
        return new Bracket(
            data.id,
            data.status,
            data.positions,
            data.tournamentId,
        );
    }
}


export class BracketPosition {
    private readonly participant: IParticipant;
    private readonly position: number;

    constructor(
        participant: IParticipant,
        position: number,
    ) {
        this.participant = participant;
        this.position = position;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        participant: IParticipant,
        position: number,
    ): BracketPosition {
        return new BracketPosition(
            participant,
            position,
        );
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    public isBye(): boolean {
        return this.participant instanceof ByeParticipant;
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------    
    public getParticipant(): IParticipant {
        return this.participant;
    }

    public getPosition(): number {
        return this.position;
    }
}
