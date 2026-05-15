import { TournamentStatus } from "@prisma/client";
import { MatchNotPendingException, MatchNotInProgressException, MatchNotSuspendedException, MatchAlreadyFinishedException, ParticipantNotFoundInMatchException } from "../exceptions/MatchExceptions.js";
import { RegisteredParticipantNotFoundException } from "../exceptions/ParticipantExceptions.js";


export enum MatchStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    SUSPENDED = 'SUSPENDED',
    CANCELLED = 'CANCELLED',
}

export class Match {
    private readonly id: string;
    private round: number;
    private boardNumber: number | null;
    private startedAt: Date | null;
    private finishedAt: Date | null;
    private status: MatchStatus;

    private readonly participant1Id: string | null;
    private readonly participant2Id: string | null;

    private matchScore: MatchScore;

    private readonly tournamentId: string;


    constructor(
        id: string,
        round: number,
        boardNumber: number | null,
        startedAt: Date | null,
        finishedAt: Date | null,
        status: MatchStatus,
        participant1Id: string | null,
        participant2Id: string | null,
        matchScore: MatchScore,
        tournamentId: string,
    ) {
        this.id = id;
        this.round = round;
        this.boardNumber = boardNumber;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.status = status;
        this.participant1Id = participant1Id;
        this.participant2Id = participant2Id;
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
        round: number,
        boardNumber?: number,
    ): Match {
        return new Match(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            round,
            boardNumber ?? null,
            null,
            null,
            MatchStatus.PENDING,
            participant1Id,
            participant2Id,
            MatchScore.create(),
            tournamentId,
        );
    }


    // --------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------
    public assignBoardNumber(boardNumber: number): void {
        this.boardNumber = boardNumber;
    }

    public addWinSet(participantId: string): void {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }
        if (participantId !== this.participant1Id && participantId !== this.participant2Id) {
            throw new ParticipantNotFoundInMatchException();
        }

        const participant = participantId === this.participant1Id ? 'P1' : 'P2';
        this.matchScore = this.matchScore.addWinSet(participant);
    }

    public addWinLeg(participantId: string): void {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }
        if (participantId !== this.participant1Id && participantId !== this.participant2Id) {
            throw new ParticipantNotFoundInMatchException();
        }

        const participant = participantId === this.participant1Id ? 'P1' : 'P2';
        this.matchScore = this.matchScore.addWinLeg(participant);
    }


    // --------------------------------------------------------------------
    // STATUS MANAGEMENT
    // --------------------------------------------------------------------
    public start() {
        if (this.status !== MatchStatus.PENDING) {
            throw new MatchNotPendingException();
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
    // GETTERS
    // --------------------------------------------------------------------
    public getId(): string {
        return this.id;
    }

    public getRound(): number {
        return this.round;
    }

    public getBoardNumber(): number | null {
        return this.boardNumber;
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
            data.boardNumber,
            data.startedAt ? new Date(data.startedAt) : null,
            data.finishedAt ? new Date(data.finishedAt) : null,
            data.status as MatchStatus,
            data.participant1Id,
            data.participant2Id,
            matchScore,
            data.tournamentId,
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
