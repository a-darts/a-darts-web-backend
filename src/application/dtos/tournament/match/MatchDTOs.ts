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
    tournamentId: string;
}

export interface CreateMatchRequestDTO {
    id: string; // Tournament ID
    participant1Id: string;
    participant2Id: string;
    round: number;
    boardNumber: number | null;
}

export interface UpdateMatchStatusRequestDTO {
    id: string;
    newStatus: MatchStatus;
}

export interface UpdateMatchBoardNumberRequestDTO {
    id: string;
    newBoardNumber: number;
}
