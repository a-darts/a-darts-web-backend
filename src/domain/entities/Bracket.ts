import { ByeParticipant, EmptyParticipant, RegisteredParticipant } from "./Participant.js";
import type { IParticipant } from "./Participant.js";
import { BracketAlreadyFinishedException, BracketInProgressException, BracketNotInDraftException, BracketNotInDraftOrPublisedException, BracketNotInProgressException, BracketNotPublishedException, DuplicateParticipantsException, InvalidPositionsException } from "../exceptions/BracketExceptions.js";
import { BracketFinishedEvent } from "../events/BracketFinishedEvent.js";
import { IDomainEvent } from "../events/IDomainEvent.js";
import { BracketSeedingService } from "../services/BracketSeedingService.js";


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

    private domainEvents: IDomainEvent[] = [];

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
    // FACTORY METHODS
    // --------------------------------------------------------------------
    /**
     * OPCIÓN A: Generación Automática
     * Crea el cuadrante barajando e intercalando los participantes automáticamente
     */
    public static createAutomatically(
        tournamentId: string,
        participants: IParticipant[],
        seedingService: BracketSeedingService,
    ): Bracket {
        // 1. Obtenemos las posiciones ya sorteadas
        const positions = seedingService.generatePositions(participants);

        // 2. Creamos el objeto cuadrante
        return new Bracket(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            BracketStatus.DRAFT,
            positions,
            tournamentId,
        );
    }

    /**
     * OPCIÓN B: Generación Manual Vacía
     * Crea la estructura de posiciones (potencia de 2) pero todas llenas de Vacías
     * para que el usuario las asigne a mano.
     */
    public static createManualEmpty(
        tournamentId: string,
        participantsCount: number,
        seedingService: BracketSeedingService,
    ): Bracket {
        seedingService.validateCount(participantsCount);

        // 1. Calculamos el tamaño del cuadrante (participantes + byes)
        const bracketSize = seedingService.calculateBracketSize(participantsCount);
        const positions: BracketPosition[] = [];

        // 2. Creamos posiciones Vacías hasta completar el tamaño del cuadrante
        for (let i = 0; i < bracketSize; i++) {
            positions.push(
                BracketPosition.create(
                    EmptyParticipant.create(),
                    i + 1,
                )
            );
        }

        // 3. Creamos el objeto cuadrante
        return new Bracket(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            BracketStatus.DRAFT,
            positions,
            tournamentId,
        );
    }


    // --------------------------------------------------------------------
    // DOMAIN METHODS
    // --------------------------------------------------------------------
    public assignParticipant(position: number, participant: IParticipant): void {
        // 1. Validar que esté en borrador o publicado
        if (this.status !== BracketStatus.DRAFT && this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotInDraftOrPublisedException();
        }

        // 2. Encontrar los índices en el array
        const index1 = this.positions.findIndex(p => p.getPosition() === position);
        if (index1 === -1) {
            throw new InvalidPositionsException();
        }

        // 3. Validar que la posición esté Vacía (EmptyParticipant)
        const participant1 = this.positions[index1].getParticipant();
        if (!(participant1 instanceof EmptyParticipant)) {
            throw new InvalidPositionsException();
        }

        // 4. Asignar el nuevo participante a la posición
        this.positions[index1] = BracketPosition.create(
            participant,
            position,
        );
    }

    public reshuffle(seedingService: BracketSeedingService): void {
        if (this.status !== BracketStatus.DRAFT && this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotInDraftOrPublisedException();
        }

        const realParticipants = this.positions
            .map(p => p.getParticipant())
            .filter(p => !(p instanceof ByeParticipant) && !(p instanceof EmptyParticipant));

        const newPositions = seedingService.generatePositions(realParticipants);
        this.positions.length = 0;
        this.positions.push(...newPositions);
    }

    public setupPositions(newPositionsData: { position: number; participant: IParticipant }[]): void {
        // 1. Validar que esté en borrador o publicado
        if (this.status !== BracketStatus.DRAFT && this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotInDraftOrPublisedException();
        }

        // 2. Validar que no nos manden más o menos posiciones de las que el cuadrante soporta
        if (newPositionsData.length !== this.positions.length) {
            throw new InvalidPositionsException();
        }

        // 3. Opcional: Validar que no haya participantes duplicados en el lote recibido
        const participantIds = newPositionsData
            .filter(d => !(d.participant instanceof EmptyParticipant) && !(d.participant instanceof ByeParticipant))
            .map(d => d.participant.getId());

        const hasDuplicates = new Set(participantIds).size !== participantIds.length;
        if (hasDuplicates) {
            throw new DuplicateParticipantsException();
        }

        // 4. Mapear y sobreescribir el array interno
        const updatedPositions = newPositionsData.map(data =>
            BracketPosition.create(data.participant, data.position)
        );

        // 5. Guardamos las nuevas posiciones
        this.positions.length = 0;
        this.positions.push(...updatedPositions);
    }


    // --------------------------------------------------------------------
    // MATCH WINNER PROMOTION
    // --------------------------------------------------------------------
    /**
     * Calcula el total de rondas basándose en la cantidad de posiciones del cuadrante
     * Post: result = log2(this.positions.length)
     * Ejemplo: 
     * - 8 participantes = log2(8) = 3 rondas
     * - 16 participantes = log2(16) = 4 rondas
     */
    public getTotalRounds(): number {
        const totalParticipants = this.positions.length;

        if (totalParticipants <= 1) {
            return 0; // No hay rondas si hay 1 o 0 participantes
        }

        // Math.log2(8) nos da 3. Usamos Math.ceil por seguridad si el número no es potencia de 2 exacta (debido a BYEs)
        return Math.ceil(Math.log2(totalParticipants));
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

    public unpublish(): void {
        if (this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotPublishedException();
        }
        this.status = BracketStatus.DRAFT;
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
        this.recordEvent(new BracketFinishedEvent(this.id, this.tournamentId));
    }

    public cancel(): void {
        if (this.status === BracketStatus.FINISHED) {
            throw new BracketAlreadyFinishedException();
        }

        this.status = BracketStatus.CANCELLED;
    }

    public delete(): void {
        if (this.status === BracketStatus.IN_PROGRESS) {
            throw new BracketInProgressException();
        }
        if (this.status === BracketStatus.FINISHED) {
            throw new BracketAlreadyFinishedException();
        }
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


    // --------------------------------------------------------------------
    // DOMAIN EVENTS
    // --------------------------------------------------------------------    
    public pullEvents(): IDomainEvent[] {
        const events = [...this.domainEvents];
        this.domainEvents = [];
        return events;
    }

    public recordEvent(event: IDomainEvent): void {
        this.domainEvents.push(event);
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

    public isEmpty(): boolean {
        return this.participant instanceof EmptyParticipant;
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
