
export interface PlayerResponseDTO {
    id: string;
    userId: string;
    registrationNumber: string;
    federation: string;
    seasonStartYear: number;
    seasonEndYear: number;
}

export interface PlayerWithUserResponseDTO {
    id: string;
    userId: string;
    registrationNumber: string;
    federation: string;
    seasonStartYear: number;
    seasonEndYear: number;
    userAlias: string;
}

export interface CreatePlayerRequestDTO {
    userId: string;
    registrationNumber: string;
    federation: string;
    season: SeasonDTO;
}

export interface GetPlayerByUserIdAndSeasonRequestDTO {
    userId: string;
    seasonStartYear: number;
}

export interface UpdatePlayerFederationRequestDTO {
    id: string;
    newFederation: string;
}

export interface SeasonDTO {
    startYear: number;
    endYear: number;
}
