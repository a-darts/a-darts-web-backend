
export interface PlayerResponseDTO {
    id: string;
    userId: string;
    registrationNumber: string;
    federation: string;
    seasonStartYear: number;
    seasonEndYear: number;
}

export interface CreatePlayerRequestDTO {
    userId: string;
    registrationNumber: string;
    federation: string;
    season: SeasonDTO;
}

export interface UpdatePlayerFederationRequestDTO {
    id: string;
    newFederation: string;
}

export interface SeasonDTO {
    startYear: number;
    endYear: number;
}
