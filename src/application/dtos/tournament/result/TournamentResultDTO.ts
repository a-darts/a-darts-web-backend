export interface TournamentResultDTO {
    id: string;
    tournamentId: string;
    participantsResults: ParticipantResultDTO[];
}

export interface ParticipantResultDTO {
    participantId: string;
    playerId: string;
    alias: string;
    federation: string;

    finalPosition: number;

    matchesWon: number;
    matchesLost: number;
    setsWon: number;
    setsLost: number;
    legsWon: number;
    legsLost: number;
}
