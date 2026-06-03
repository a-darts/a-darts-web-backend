import { PlayerStatus } from "../../../domain/entities/Player.js";

export interface PlayerResponseDTO {
    id: string;
    userId: string;
    registrationNumber: string;
    federation: string;
    seasonStartYear: number;
    status: PlayerStatus;
}

export interface PlayerWithUserResponseDTO {
    id: string;
    userId: string;
    registrationNumber: string;
    federation: string;
    seasonStartYear: number;
    status: PlayerStatus;
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
}

export interface PaginatedPlayersWithUserResponse {
    players: PlayerWithUserResponseDTO[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
