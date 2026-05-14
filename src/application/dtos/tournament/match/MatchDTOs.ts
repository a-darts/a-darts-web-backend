import { MatchStatus } from "../../../../domain/entities/Match.js";

export interface MatchResponseDTO {
    id: string;
    round: number;
    boardNumber: number | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    status: MatchStatus;
    participant1: ParticipantResponseDTO;
    participant2: ParticipantResponseDTO;
    matchScore: MatchScoreDTO;
}

export interface ParticipantResponseDTO {
    id: string;
    alias: string;
    federation: string;
}

export interface MatchScoreDTO {
    participant1: {
        setsWon: number;
        legsWon: number;
    };
    participant2: {
        setsWon: number;
        legsWon: number;
    };
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

export interface RegisterLegWinRequestDTO {
    id: string;
    participantId: string;
}

export interface RegisterSetWinRequestDTO {
    id: string;
    participantId: string;
}
