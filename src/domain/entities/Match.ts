import { IDomainEvent } from "../events/IDomainEvent.js";
import { MatchFinishedEvent } from "../events/MatchEvents.js";
import {
    MatchNotPendingException,
    MatchNotInProgressException,
    MatchNotSuspendedException,
    MatchAlreadyFinishedException,
    ParticipantNotFoundInMatchException,
    MatchNotReadyException,
    MatchBoardNumberRequiredException,
} from "../exceptions/MatchExceptions.js";


export enum MatchStatus {
    PENDING = 'PENDING',
    READY = 'READY',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    SUSPENDED = 'SUSPENDED',
    CANCELLED = 'CANCELLED',
}

export class Match {
    private readonly id: string;
    private round: number;
    private matchIndex: number;
    private startedAt: Date | null;
    private finishedAt: Date | null;
    private status: MatchStatus;

    private participant1Id: string | null;
    private participant2Id: string | null;

    private readonly isParticipant1Bye: boolean;
    private readonly isParticipant2Bye: boolean;

    private matchScore: MatchScore;

    private readonly tournamentId: string;

    private domainEvents: IDomainEvent[] = [];


    constructor(
        id: string,
        round: number,
        matchIndex: number,
        startedAt: Date | null,
        finishedAt: Date | null,
        status: MatchStatus,
        participant1Id: string | null,
        participant2Id: string | null,
        isParticipant1Bye: boolean,
        isParticipant2Bye: boolean,
        matchScore: MatchScore,
        tournamentId: string,
    ) {
        this.id = id;
        this.round = round;
        this.matchIndex = matchIndex;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.status = status;
        this.participant1Id = participant1Id;
        this.participant2Id = participant2Id;
        this.isParticipant1Bye = isParticipant1Bye;
        this.isParticipant2Bye = isParticipant2Bye;
        this.matchScore = matchScore;
        this.tournamentId = tournamentId;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        tournamentId: string,
        participant1Id: string | null,
        participant2Id: string | null,
        isParticipant1Bye: boolean,
        isParticipant2Bye: boolean,
        round: number,
        matchIndex: number,
    ): Match {
        const isByeMatch = isParticipant1Bye || isParticipant2Bye;
        const isReady = participant1Id !== null && participant2Id !== null;
        const initialStatus = isByeMatch
            ? MatchStatus.FINISHED
            : (isReady ? MatchStatus.READY : MatchStatus.PENDING);
        const finishedAt = isByeMatch ? new Date() : null;

        return new Match(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            round,
            matchIndex,
            null,
            finishedAt,
            initialStatus,
            participant1Id,
            participant2Id,
            isParticipant1Bye,
            isParticipant2Bye,
            MatchScore.create(),
            tournamentId,
        );
    }


    // --------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------
    public addWinSet(participantId: string): void {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }

        const position = this.getParticipantPosition(participantId);
        this.matchScore = this.matchScore.addWinSet(position);
    }

    public addWinLeg(participantId: string): void {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }

        const position = this.getParticipantPosition(participantId);
        this.matchScore = this.matchScore.addWinLeg(position);
    }

    public setScore(p1Sets: number, p1Legs: number, p2Sets: number, p2Legs: number): void {
        this.matchScore = new MatchScore(
            new ParticipantScore(p1Sets, p1Legs),
            new ParticipantScore(p2Sets, p2Legs)
        );
    }

    public getParticipantPosition(participantId: string): 'P1' | 'P2' {
        if (participantId === this.participant1Id) return 'P1';
        if (participantId === this.participant2Id) return 'P2';
        throw new ParticipantNotFoundInMatchException();
    }

    public getWinnerId(): string | null {
        if (this.status !== MatchStatus.FINISHED) return null;

        // Si uno de los dos jugadores es bye, el otro gana
        if (this.isParticipant1Bye) return this.participant2Id;
        if (this.isParticipant2Bye) return this.participant1Id;

        // Si ambos jugadores son reales, comparamos el score
        const s1 = this.matchScore.getParticipant1Score().getSetsWon();
        const s2 = this.matchScore.getParticipant2Score().getSetsWon();

        if (s1 > s2) return this.participant1Id;
        if (s2 > s1) return this.participant2Id;

        return null; // Empate o error
    }


    public promoteWinner(participantId: string, slot: 'P1' | 'P2'): void {
        if (this.status === MatchStatus.FINISHED) {
            throw new MatchAlreadyFinishedException();
        }

        if (slot === 'P1') {
            this.participant1Id = participantId;
        } else {
            this.participant2Id = participantId;
        }

        if (this.participant1Id !== null && this.participant2Id !== null) {
            this.status = MatchStatus.READY;
        }
    }


    // --------------------------------------------------------------------
    // STATUS MANAGEMENT
    // --------------------------------------------------------------------
    public start() {
        if (this.status !== MatchStatus.READY) {
            throw new MatchNotReadyException();
        }

        this.status = MatchStatus.IN_PROGRESS;
        this.startedAt = new Date();
    }

    public finish() {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }

        this.status = MatchStatus.FINISHED;
        this.finishedAt = new Date();

        this.record(
            new MatchFinishedEvent(
                this.id,
                this.tournamentId,
            )
        );
    }

    public cancel() {
        if (this.status === MatchStatus.FINISHED) {
            throw new MatchAlreadyFinishedException();
        }

        this.status = MatchStatus.CANCELLED;
    }

    public suspend() {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }

        this.status = MatchStatus.SUSPENDED;
    }

    public resume() {
        if (this.status !== MatchStatus.SUSPENDED) {
            throw new MatchNotSuspendedException();
        }

        this.status = MatchStatus.IN_PROGRESS;
    }


    // --------------------------------------------------------------------
    // DOMAIN EVENTS
    // --------------------------------------------------------------------
    public pullEvents(): IDomainEvent[] {
        const events = [...this.domainEvents];
        this.domainEvents = [];
        return events;
    }

    protected record(event: IDomainEvent): void {
        this.domainEvents.push(event);
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getId(): string {
        return this.id;
    }

    public getRound(): number {
        return this.round;
    }

    public getMatchIndex(): number {
        return this.matchIndex;
    }

    public getStartedAt(): Date | null {
        return this.startedAt;
    }

    public getFinishedAt(): Date | null {
        return this.finishedAt;
    }

    public getStatus(): MatchStatus {
        return this.status;
    }

    public getParticipant1Id(): string | null {
        return this.participant1Id;
    }

    public getParticipant2Id(): string | null {
        return this.participant2Id;
    }

    public getIsParticipant1Bye(): boolean {
        return this.isParticipant1Bye;
    }

    public getIsParticipant2Bye(): boolean {
        return this.isParticipant2Bye;
    }

    public getMatchScore(): MatchScore {
        return this.matchScore;
    }

    public getTournamentId(): string {
        return this.tournamentId;
    }


    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    static rehydrate(data: any): Match {
        const matchScore = MatchScore.rehydrate(
            data.matchScore.participant1,
            data.matchScore.participant2
        );

        return new Match(
            data.id,
            data.round,
            data.matchIndex,
            data.startedAt ? new Date(data.startedAt) : null,
            data.finishedAt ? new Date(data.finishedAt) : null,
            data.status as MatchStatus,
            data.participant1Id,
            data.participant2Id,
            data.isParticipant1Bye,
            data.isParticipant2Bye,
            matchScore,
            data.tournamentId,
        );
    }
}



export class MatchScore {
    private readonly scores: Record<'P1' | 'P2', ParticipantScore>;

    constructor(p1Score: ParticipantScore, p2Score: ParticipantScore) {
        this.scores = {
            P1: p1Score,
            P2: p2Score
        };
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(): MatchScore {
        return new MatchScore(
            ParticipantScore.create(),
            ParticipantScore.create(),
        );
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    public addWinLeg(position: 'P1' | 'P2'): MatchScore {
        return new MatchScore(
            position === 'P1' ? this.scores.P1.winLeg() : this.scores.P1,
            position === 'P2' ? this.scores.P2.winLeg() : this.scores.P2
        );
    }

    public addWinSet(position: 'P1' | 'P2'): MatchScore {
        return new MatchScore(
            position === 'P1' ? this.scores.P1.winSet() : this.scores.P1.newSet(),
            position === 'P2' ? this.scores.P2.winSet() : this.scores.P2.newSet()
        );
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getParticipant1Score(): ParticipantScore {
        return this.scores.P1;
    }

    public getParticipant2Score(): ParticipantScore {
        return this.scores.P2;
    }


    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    static rehydrate(
        p1Data: { setsWon: number; legsWon: number },
        p2Data: { setsWon: number; legsWon: number }
    ): MatchScore {
        return new MatchScore(
            new ParticipantScore(p1Data.setsWon, p1Data.legsWon),
            new ParticipantScore(p2Data.setsWon, p2Data.legsWon)
        );
    }
}




export class ParticipantScore {
    private readonly setsWon: number;
    private readonly legsWon: number;

    constructor(
        setsWon: number,
        legsWon: number,
    ) {
        this.setsWon = setsWon;
        this.legsWon = legsWon;
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(): ParticipantScore {
        return new ParticipantScore(
            0,
            0,
        );
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    public winLeg(): ParticipantScore {
        return new ParticipantScore(
            this.setsWon,
            this.legsWon + 1,
        );
    }

    public winSet(): ParticipantScore {
        return new ParticipantScore(
            this.setsWon + 1,
            0,
        );
    }

    public newSet(): ParticipantScore {
        return new ParticipantScore(
            this.setsWon,
            0,
        );
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getLegsWon(): number {
        return this.legsWon;
    }

    public getSetsWon(): number {
        return this.setsWon;
    }
}
