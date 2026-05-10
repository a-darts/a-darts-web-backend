export interface RegisteredParticipantsResponseDTO {
    id: string;
    playerId: string;
    registeredAt: Date;
    checkedInAt: Date | null;
}

export interface RegisteredParticipantsNameFederationResponseDTO {
    participants: RegisteredParticipantsNameFederationDTO[];
}

export interface RegisteredParticipantsNameFederationDTO {
    id: string;
    alias: string;
    federation: string;
}

