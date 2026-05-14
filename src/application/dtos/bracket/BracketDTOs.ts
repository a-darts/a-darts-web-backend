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
}

export interface CreateBracketRequestDTO {
    id: string; // Tournament ID
}
