import { ByeParticipant } from "./Participant.js";
import type { IParticipant } from "./Participant.js";

import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from "../exceptions/ParticipantExceptions.js";
import { BracketAlreadyFinishedException, BracketNotInDraftException, BracketNotInDraftOrPublisedException, BracketNotInProgressException, InvalidPositionsException } from "../exceptions/BracketExceptions.js";
import { Match } from "./Match.js";


export enum BracketStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED',
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

        if (totalParticipants === 0) {
            throw new RegistratedParticipantsEmptyException();
        }
        if (totalParticipants < 2) {
            throw new RegistratedParticipantsNotEnoughException(2, totalParticipants);
        }

        const bracketSize = this.calculateBracketSize(totalParticipants);

        // 1. Barajamos los participantes (orden aleatorio) y clonamos
        const shuffledParticipants = this.shuffle([...participants]);

        // 2. Creamos la lista de participantes (reales + byes)
        const fullParticipantList: IParticipant[] = shuffledParticipants;
        const numByes = bracketSize - totalParticipants;

        // 3. Añadimos los byes a la lista
        for (let i = 0; i < numByes; i++) {
            fullParticipantList.push(ByeParticipant.create());
        }

        // 4. Ordenamos los participantes y los byes (Standard Tournament Seeding)
        const interleavedParticipants = this.distributePositions(fullParticipantList);

        // 5. Mapeamos la lista de participantes a posiciones del cuadrante
        const positions = interleavedParticipants.map((participant, index) =>
            BracketPosition.create(participant, index + 1)
        );

        // 6. Creamos el objeto cuadrante
        return new Bracket(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            BracketStatus.DRAFT,
            positions,
            tournamentId,
        );
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    /**
     * Calcula la potencia de 2 más cercana (hacia arriba)
     * Ejemplo: 5 participantes -> 8 posiciones.
     */
    private static calculateBracketSize(n: number): number {
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


    /**
     * Algoritmo Fisher-Yates para barajar un array
     */
    private static shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }


    // --------------------------------------------------------------------
    // DOMAIN METHODS
    // --------------------------------------------------------------------
    public swapPositions(pos1: number, pos2: number): void {
        // 1. Validar que esté en borrador o publicado
        if (this.status !== BracketStatus.DRAFT && this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotInDraftOrPublisedException();
        }

        // 2. Encontrar los índices en el array
        const index1 = this.positions.findIndex(p => p.getPosition() === pos1);
        const index2 = this.positions.findIndex(p => p.getPosition() === pos2);

        // 3. Validar que ambas posiciones existan
        if (index1 === -1 || index2 === -1) {
            throw new InvalidPositionsException();
        }

        // 4. Obtener los participantes actuales
        const participant1 = this.positions[index1].getParticipant();
        const participant2 = this.positions[index2].getParticipant();

        // 5. Realizar el intercambio creando nuevas instancias de BracketPosition
        // Mantenemos el número de posición original pero cambiamos el participante
        this.positions[index1] = BracketPosition.create(participant2, pos1);
        this.positions[index2] = BracketPosition.create(participant1, pos2);
    }


    public reshuffle(): void {
        // 1. Validar que esté en borrador o publicado
        if (this.status !== BracketStatus.DRAFT && this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotInDraftOrPublisedException();
        }

        // 2. Extraer solo los participantes reales (ignorando los Byes actuales)
        const realParticipants = this.positions
            .map(p => p.getParticipant())
            .filter(participant => !(participant instanceof ByeParticipant));

        // 3. Volver a barajar los participantes reales
        const shuffled = Bracket.shuffle([...realParticipants]);

        // 4. Calcular cuántos byes necesitamos (basado en el tamaño actual del bracket)
        const totalSlots = this.positions.length;
        const numByes = totalSlots - shuffled.length;

        // 5. Re-crear la lista completa con los nuevos Byes
        const fullList: IParticipant[] = [...shuffled];
        for (let i = 0; i < numByes; i++) {
            fullList.push(ByeParticipant.create());
        }

        // 6. Aplicar de nuevo el algoritmo de distribución (Standard Tournament Seeding)
        const interleaved = Bracket.distributePositions(fullList);

        // 7. Limpiar y actualizar el array de posiciones
        this.positions.length = 0;
        interleaved.forEach((participant, index) => {
            this.positions.push(BracketPosition.create(participant, index + 1));
        });
    }


    public generateInitialMatches(): Match[] {
        if (this.status !== BracketStatus.IN_PROGRESS) {
            throw new BracketNotInProgressException();
        }

        const matches: Match[] = [];
        const positions = this.getPositions();

        // Agrupamos de 2 en 2 para crear los partidos
        for (let i = 0; i < positions.length; i += 2) {
            const p1 = positions[i].getParticipant();
            const p2 = positions[i + 1].getParticipant();

            const p1Id = p1 instanceof ByeParticipant ? null : p1.getId();
            const p2Id = p2 instanceof ByeParticipant ? null : p2.getId();

            const match = Match.create(
                this.tournamentId,
                p1Id,
                p2Id,
                1, // Round 1
            );

            // MIRAR
            // Lógica automática para BYES:
            // Si uno es ByeParticipant, el partido podría marcarse como FINISHED directamente
            // Pero eso lo puede gestionar un Service para mantener limpia la entidad.

            matches.push(match);
        }

        return matches;
    }


    // --------------------------------------------------------------------
    // STATUS MANAGEMENT METHODS
    // --------------------------------------------------------------------
    public publish(): void {
        if (this.status !== BracketStatus.DRAFT) {
            throw new BracketNotInDraftException();
        }
        this.status = BracketStatus.PUBLISHED;
    }

    public start(): void {
        if (this.status !== BracketStatus.PUBLISHED && this.status !== BracketStatus.DRAFT) {
            throw new BracketNotInDraftOrPublisedException();
        }
        this.status = BracketStatus.IN_PROGRESS;
    }

    public finish(): void {
        if (this.status !== BracketStatus.IN_PROGRESS) {
            throw new BracketNotInProgressException();
        }
        this.status = BracketStatus.FINISHED;
    }

    public cancel(): void {
        if (this.status === BracketStatus.FINISHED) {
            throw new BracketAlreadyFinishedException();
        }

        this.status = BracketStatus.CANCELLED;
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
