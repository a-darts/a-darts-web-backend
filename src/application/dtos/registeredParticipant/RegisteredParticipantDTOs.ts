export interface RegisteredParticipantResponseDTO {
    id: string;
    playerId: string;
    registeredAt: Date;
    checkedInAt: Date | null;
    alias: string;
    federation: string;
}

export interface RegisteredParticipantsNameFederationResponseDTO {
    participants: RegisteredParticipantsNameFederationDTO[];
}

export interface RegisteredParticipantsNameFederationDTO {
    id: string;
    alias: string;
    federation: string;
}

