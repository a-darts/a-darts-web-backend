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

    private readonly participant1Id: string;
    private readonly participant2Id: string;

    private matchScore: MatchScore;

    private readonly tournamentId: string;


    constructor(
        id: string,
        round: number,
        boardNumber: number | null,
        startedAt: Date | null,
        finishedAt: Date | null,
        status: MatchStatus,
        participant1Id: string,
        participant2Id: string,
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
        participant1Id: string,
        participant2Id: string,
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
            MatchScore.create(participant1Id, participant2Id),
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

        this.matchScore = this.matchScore.addWinSet(participantId);
    }

    public addWinLeg(participantId: string): void {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }
        if (participantId !== this.participant1Id && participantId !== this.participant2Id) {
            throw new ParticipantNotFoundInMatchException();
        }

        this.matchScore = this.matchScore.addWinLeg(participantId);
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

    public getParticipant1Id(): string {
        return this.participant1Id;
    }

    public getParticipant2Id(): string {
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
        const scoreData = {
            [data.participant1Id]: {
                setsWon: data.matchScore.participant1.setsWon,
                legsWon: data.matchScore.participant1.legsWon,
            },
            [data.participant2Id]: {
                setsWon: data.matchScore.participant2.setsWon,
                legsWon: data.matchScore.participant2.legsWon,
            }
        };
        const matchScore = MatchScore.rehydrate(scoreData);
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
    private readonly scores: Record<string, ParticipantScore>;

    constructor(
        scores: Record<string, ParticipantScore>,
    ) {
        this.scores = { ...scores };
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        participant1Id: string,
        participant2Id: string,
    ): MatchScore {
        return new MatchScore({
            [participant1Id]: ParticipantScore.create(),
            [participant2Id]: ParticipantScore.create(),
        });
    }


    // --------------------------------------------------------------------
    // HELPER METHODS
    // --------------------------------------------------------------------
    public addWinLeg(participantId: string): MatchScore {
        if (!this.scores[participantId]) {
            throw new ParticipantNotFoundInMatchException();
        }
        const newScores = {
            ...this.scores,
            [participantId]: this.scores[participantId].winLeg(),
        }
        return new MatchScore(newScores);
    }

    public addWinSet(participantId: string): MatchScore {
        if (!this.scores[participantId]) {
            throw new ParticipantNotFoundInMatchException();
        }

        const newScores: Record<string, ParticipantScore> = {};
        for (const id in this.scores) {
            if (id === participantId) {
                // Al ganador le sumamos el set
                newScores[id] = this.scores[id].winSet();
            } else {
                // A los demás les reseteamos los legs a 0 manteniendo sus sets
                newScores[id] = this.scores[id].newSet();
            }
        }

        return new MatchScore(newScores);
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getScoreForParticipant(participantId: string): ParticipantScore {
        return this.scores[participantId];
    }

    public getScores(): Record<string, ParticipantScore> {
        return { ...this.scores };
    }


    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    static rehydrate(data: Record<string, { setsWon: number, legsWon: number }>): MatchScore {
        const scores: Record<string, ParticipantScore> = {};
        for (const [id, value] of Object.entries(data)) {
            scores[id] = new ParticipantScore(value.setsWon, value.legsWon);
        }
        return new MatchScore(scores);
    }
}
