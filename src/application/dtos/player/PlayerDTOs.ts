
export interface PlayerResponseDto {
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

export interface SeasonDTO {
    startYear: number;
    endYear: number;
}
