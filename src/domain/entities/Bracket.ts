import { ByeParticipant, EmptyParticipant, RegisteredParticipant } from "./Participant.js";
import type { IParticipant } from "./Participant.js";

import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from "../exceptions/ParticipantExceptions.js";
import { BracketAlreadyFinishedException, BracketNotInDraftException, BracketNotInDraftOrPublisedException, BracketNotInProgressException, BracketNotPublishedException, DuplicateParticipantsException, InvalidPositionsException } from "../exceptions/BracketExceptions.js";
import { Match } from "./Match.js";


export enum BracketStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED',
}

interface MatchBuilderData {
    p1Id: string | null;
    p2Id: string | null;
    isP1Bye: boolean;
    isP2Bye: boolean;
    round: number;
    matchIndex: number;
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
    /**
     * OPCIÓN A: Generación Automática
     * Crea el cuadrante barajando e intercalando los participantes automáticamente
     */
    public static createAutomatically(
        tournamentId: string,
        participants: IParticipant[],
    ): Bracket {
        this.validateParticipantsCount(participants.length);

        // 1. Obtenemos las posiciones ya sorteadas
        const positions = this.generateSeededPositions(participants);

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
        participantsCount: number
    ): Bracket {
        this.validateParticipantsCount(participantsCount);

        // 1. Calculamos el tamaño del cuadrante (participantes + byes)
        const bracketSize = this.calculateBracketSize(participantsCount);
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
    // HELPER METHODS
    // --------------------------------------------------------------------
    private static validateParticipantsCount(count: number): void {
        if (count === 0) {
            throw new RegistratedParticipantsEmptyException();
        }
        if (count < 2) {
            throw new RegistratedParticipantsNotEnoughException(2, count);
        }
    }

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

    private static generateSeededPositions(participants: IParticipant[]): BracketPosition[] {
        const totalParticipants = participants.length;
        const bracketSize = this.calculateBracketSize(totalParticipants);

        // 1. Barajamos los participantes (orden aleatorio) y clonamos
        const shuffledParticipants = this.shuffle([...participants]);

        // 2. Creamos la lista completa agregando los Byes necesarios
        const fullParticipantList: IParticipant[] = shuffledParticipants;
        const numByes = bracketSize - totalParticipants;

        for (let i = 0; i < numByes; i++) {
            fullParticipantList.push(ByeParticipant.create());
        }

        // 3. Ordenamos usando Standard Tournament Seeding
        const interleavedParticipants = this.distributePositions(fullParticipantList);

        // 4. Mapeamos a las posiciones del cuadrante
        return interleavedParticipants.map((participant, index) =>
            BracketPosition.create(participant, index + 1)
        );
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

    public reshuffle(): void {
        // 1. Validar que esté en borrador o publicado
        if (this.status !== BracketStatus.DRAFT && this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotInDraftOrPublisedException();
        }

        // 2. Filtrar únicamente los participantes reales (ignoramos Byes y Empties)
        const realParticipants = this.positions
            .map(p => p.getParticipant())
            .filter(participant =>
                !(participant instanceof ByeParticipant) &&
                !(participant instanceof EmptyParticipant)
            );

        // 3. Validar de nuevo que el total de participantes rescatados siga siendo válido
        Bracket.validateParticipantsCount(realParticipants.length);

        // 4. Obtenemos las posiciones ya sorteadas
        const newPositions = Bracket.generateSeededPositions(realParticipants);

        // 5. Guardamos las nuevas posiciones
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





    public generateInitialMatches(): Match[] {
        if (this.status !== BracketStatus.IN_PROGRESS) {
            throw new BracketNotInProgressException();
        }

        const N = this.positions.length;
        const totalMatches = N - 1;
        const round1Size = N / 2;

        // 1. Preparar el esqueleto temporal de partidos
        const matchesData = this.initializeMatchesDataSkeleton(totalMatches);

        // 3. Poblar la ronda 1 según las posiciones del cuadrante
        this.populateFirstRound(matchesData, round1Size);

        // 4. Calcular iterativamente las siguientes rondas propagando los flujos de BYEs
        this.propagateRoundsAndByes(matchesData, round1Size);

        // 5. Mapear los datos temporales a instancias reales de la entidad de dominio Match
        return this.buildDomainMatches(matchesData);
    }


    // --------------------------------------------------------------------
    // PRIVATE MATCH GENERATION HELPERS
    // --------------------------------------------------------------------
    private initializeMatchesDataSkeleton(totalMatches: number): MatchBuilderData[] {
        return new Array(totalMatches).fill(null).map(() => ({
            p1Id: null,
            p2Id: null,
            isP1Bye: false,
            isP2Bye: false,
            round: 0,
            matchIndex: 0,
        }));
    }

    private populateFirstRound(matchesData: MatchBuilderData[], round1Size: number): void {
        const sortedPositions =
            [...this.getPositions()].sort((a, b) => a.getPosition() - b.getPosition());

        for (let i = 0; i < round1Size; i++) {
            const p1 = sortedPositions[i * 2].getParticipant();
            const p2 = sortedPositions[i * 2 + 1].getParticipant();

            const p1IsBye = p1 instanceof ByeParticipant;
            const p2IsBye = p2 instanceof ByeParticipant;
            const p1IsEmpty = p1 instanceof EmptyParticipant;
            const p2IsEmpty = p2 instanceof EmptyParticipant;

            matchesData[i].p1Id = (p1IsBye || p1IsEmpty) ? null : p1.getId();
            matchesData[i].p2Id = (p2IsBye || p2IsEmpty) ? null : p2.getId();
            matchesData[i].isP1Bye = p1IsBye;
            matchesData[i].isP2Bye = p2IsBye;
            matchesData[i].round = 1;
            matchesData[i].matchIndex = i + 1;
        }
    }

    private propagateRoundsAndByes(matchesData: MatchBuilderData[], initialRoundSize: number): void {
        let currentRoundStartIdx = 0;
        let currentRoundSize = initialRoundSize;
        let currentRound = 1;

        while (currentRoundSize > 1) {
            const nextRoundSize = currentRoundSize / 2;
            const nextRoundStartIdx = currentRoundStartIdx + currentRoundSize;

            // Inicializar metadatos de la siguiente ronda
            for (let j = 0; j < nextRoundSize; j++) {
                const nextMatchIdx = nextRoundStartIdx + j;
                matchesData[nextMatchIdx].round = currentRound + 1;
                matchesData[nextMatchIdx].matchIndex = j + 1;
            }

            // Propagar ganadores automáticos por BYE
            for (let i = 0; i < currentRoundSize; i++) {
                const currentMatchIdx = currentRoundStartIdx + i;
                const currentMatch = matchesData[currentMatchIdx];

                if (currentMatch.isP1Bye || currentMatch.isP2Bye) {
                    this.advanceParticipantOrBye(matchesData, currentMatch, nextRoundStartIdx, i);
                }
            }

            currentRoundStartIdx = nextRoundStartIdx;
            currentRoundSize = nextRoundSize;
            currentRound++;
        }
    }

    private advanceParticipantOrBye(
        matchesData: MatchBuilderData[],
        currentMatch: MatchBuilderData,
        nextRoundStartIdx: number,
        currentMatchIterationIdx: number
    ): void {
        const advancingWinnerId = currentMatch.isP1Bye ? currentMatch.p2Id : currentMatch.p1Id;
        const currentMatchIdxBasedOn0 = currentMatch.matchIndex - 1;
        const nextMatchIdx = nextRoundStartIdx + Math.floor(currentMatchIdxBasedOn0 / 2);
        const isSlotP1 = currentMatchIterationIdx % 2 === 0;

        if (advancingWinnerId) {
            if (isSlotP1) {
                matchesData[nextMatchIdx].p1Id = advancingWinnerId;
            } else {
                matchesData[nextMatchIdx].p2Id = advancingWinnerId;
            }
        } else {
            // Caso extremo: si ambos fuesen BYE, se propaga un hueco vacío marcado como BYE
            if (isSlotP1) {
                matchesData[nextMatchIdx].p1Id = null;
                matchesData[nextMatchIdx].isP1Bye = true;
            } else {
                matchesData[nextMatchIdx].p2Id = null;
                matchesData[nextMatchIdx].isP2Bye = true;
            }
        }
    }

    private buildDomainMatches(matchesData: MatchBuilderData[]): Match[] {
        return matchesData.map(m =>
            Match.create(
                this.tournamentId,
                m.p1Id,
                m.p2Id,
                m.isP1Bye,
                m.isP2Bye,
                m.round,
                m.matchIndex,
            )
        );
    }


    // --------------------------------------------------------------------
    // MATCH WINNER PROMOTION
    // --------------------------------------------------------------------
    public getNextMatchCoordinatesFor(match: Match): { round: number; matchIndex: number; slot: 'P1' | 'P2' } | null {
        // Si tu torneo es eliminación directa clásica:
        const nextRound = match.getRound() + 1;

        // Si ya es la ronda final del bracket, no hay siguiente partido
        if (nextRound > this.getTotalRounds()) return null;

        const currentMatchIndexBasedOn0 = match.getMatchIndex() - 1;
        const nextMatchIndex = Math.floor(currentMatchIndexBasedOn0 / 2) + 1;
        const slot = currentMatchIndexBasedOn0 % 2 === 0 ? 'P1' : 'P2';

        return { round: nextRound, matchIndex: nextMatchIndex, slot };
    }

    /**
     * Orquesta el paso de un jugador de un partido a otro
     */
    public advanceWinner(currentMatch: Match, nextMatch: Match): void {
        const winnerId = currentMatch.getWinnerId();
        if (!winnerId) return;

        const coords = this.getNextMatchCoordinatesFor(currentMatch);
        if (!coords) return;

        // El bracket le dice al siguiente partido que acepte al ganador en el slot calculado
        nextMatch.promoteWinner(winnerId, coords.slot);
    }

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
    public unpublish(): void {
        if (this.status !== BracketStatus.PUBLISHED) {
            throw new BracketNotPublishedException();
        }
        this.status = BracketStatus.DRAFT;
    }

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
