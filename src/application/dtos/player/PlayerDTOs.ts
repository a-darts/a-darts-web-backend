
export interface PlayerResponseDto {
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
    seasonStartYear: number;
    seasonEndYear: number;
}
