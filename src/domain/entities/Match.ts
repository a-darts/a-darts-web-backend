import { MatchNotPendingException, MatchNotInProgressException, MatchNotSuspendedException } from "../exceptions/MatchExceptions.js";


export enum MatchStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    SUSPENDED = 'SUSPENDED',
    ABANDONED = 'ABANDONED',
}

export class Match {
    private readonly id: string;
    private round: number;
    private boardNumber: number | null;
    private startedAt: Date | null;
    private finishedAt: Date | null;
    private status: MatchStatus;

    private participant1Id: string;
    private participant2Id: string;

    private matchScore: MatchScore;


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
    }


    // --------------------------------------------------------------------
    // FACTORY METHOD
    // --------------------------------------------------------------------
    public static create(
        round: number,
        participant1Id: string,
        participant2Id: string,
    ): Match {
        return new Match(
            crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
            round,
            null,
            null,
            null,
            MatchStatus.PENDING,
            participant1Id,
            participant2Id,
            MatchScore.create(participant1Id, participant2Id),
        );
    }


    // --------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------
    public assignBoardNumber(boardNumber: number): void {
        this.boardNumber = boardNumber;
    }


    // --------------------------------------------------------------------
    // STATUS MANAGEMENT
    // --------------------------------------------------------------------
    public start() {
        if (this.status !== MatchStatus.PENDING) {
            throw new MatchNotPendingException();
        }

        this.status = MatchStatus.IN_PROGRESS;
    }

    public finish() {
        if (this.status !== MatchStatus.IN_PROGRESS) {
            throw new MatchNotInProgressException();
        }

        this.status = MatchStatus.FINISHED;
    }

    public abandon() {
        this.status = MatchStatus.ABANDONED;
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
        this.scores = scores;
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
    public addWinLeg(participantId: string): void {
        this.scores[participantId] = this.scores[participantId].winLeg();
    }

    public addWinSet(participantId: string): void {
        this.scores[participantId] = this.scores[participantId].winSet();
    }


    // --------------------------------------------------------------------
    // GETTERS
    // --------------------------------------------------------------------
    public getScoreForParticipant(participantId: string): ParticipantScore {
        return this.scores[participantId];
    }

    public getScores(): Record<string, ParticipantScore> {
        return this.scores;
    }


    // --------------------------------------------------------------------
    // REHYDRATE METHOD
    // --------------------------------------------------------------------
    static rehydrate(data: Record<string, { sets: number, legs: number }>): MatchScore {
        const scores: Record<string, ParticipantScore> = {};
        for (const [id, value] of Object.entries(data)) {
            scores[id] = new ParticipantScore(value.sets, value.legs);
        }
        return new MatchScore(scores);
    }
}
