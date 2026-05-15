export interface BracketResponseDTO {
    id: string;
    tournamentId: string;
    status: string;
    totalPositions: number;
    positions: BracketPositionResponseDTO[];
}

export interface BracketPositionResponseDTO {
    position: number;
    participantId: string | null;
    participantAlias: string; // "Bye" o el Alias del jugador
    participantFederation: string;
}

export interface CreateBracketRequestDTO {
    id: string; // Tournament ID
}

export interface ReshuffleBracketRequestDTO {
    id: string; // Bracket ID
}

export interface UpdateBracketPositionsRequestDTO {
    id: string; // Bracket ID
    position1: number;
    position2: number;
}
