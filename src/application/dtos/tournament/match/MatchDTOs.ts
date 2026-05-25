import { MatchStatus } from "../../../../domain/entities/Match.js";

export interface MatchResponseDTO {
    id: string;
    round: number;
    matchIndex: number;
    boardNumber: number | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    status: MatchStatus;
    tournamentId: string;
    participant1: ParticipantResponseDTO;
    participant2: ParticipantResponseDTO;
    matchScore: MatchScoreDTO;
}

export interface ParticipantResponseDTO {
    id: string | null;
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

export interface SetMatchResultRequestDTO {
    id: string;
    participant1Sets: number;
    participant1Legs: number;
    participant2Sets: number;
    participant2Legs: number;
}
