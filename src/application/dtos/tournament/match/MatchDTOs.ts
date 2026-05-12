import { MatchStatus } from "../../../../domain/entities/Match.js";

export interface MatchResponseDTO {
    id: string;
    round: number;
    boardNumber: number | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    status: MatchStatus;
    participant1Id: string;
    participant2Id: string;
    matchScore: {
        participant1: {
            setsWon: number;
            legsWon: number;
        },
        participant2: {
            setsWon: number;
            legsWon: number;
        },
    };
}
