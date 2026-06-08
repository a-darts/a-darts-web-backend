import { RegistrationStatus } from "../../../domain/entities/Registration.js";
import { TournamentStatus } from "../../../domain/entities/Tournament.js";
import { GameModes, GameTypes, ScheduleTypes } from "../../../domain/entities/TournamentInfo.js";

export interface TournamentResponseDTO {
    id: string;
    name: string;
    seasonStartYear: number;
    createdAt: Date;
    createdBy: string;
    status: TournamentStatus;
    isDelayed: boolean;
    info: TournamentInfoDTO;
    registration: RegistrationDTO;
}

export interface PaginatedTournamentResponseDTO {
    tournaments: TournamentResponseDTO[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}


interface TournamentInfoDTO {
    place: string;
    dateTime: Date;
    mode: GameModes;
    game: string;
    schedule: ScheduleTypes;
    maxPlayers: number | null;
    gameType: GameTypes;
    numLegs: number;
    numSets: number;
    rules: string;
    info: string;
    federation: string;
}

interface RegistrationDTO {
    hasCheckIn: boolean;
    status: RegistrationStatus;
    registrationPeriod: RegistrationPeriodDTO;
}

interface RegistrationPeriodDTO {
    startsAt: Date | null;
    endsAt: Date | null;
}

export interface CreateTournamentRequestDTO {
    userId: string; // User that creates the tournament
    name: string;
    seasonStartYear: number;
    info: TournamentInfoDTO;
}

export interface UpdateTournamentInfoRequestDTO {
    id: string;
    newInfo: TournamentInfoDTO;
}

export interface UpdateTournamentNameRequestDTO {
    id: string;
    newName: string;
}

export interface UpdateTournamentRegistrationPeriodRequestDTO {
    id: string;
    newRegistrationPeriod: RegistrationPeriodDTO;
}

export interface RegisterParticipantInTournamentRequestDTO {
    id: string;
    playerId: string;
}

export interface UnregisterParticipantInTournamentRequestDTO {
    id: string;
    participantId: string;
}

export interface DoCheckInParticipantRequestDTO {
    id: string;
    participantId: string;
}

export interface UndoCheckInParticipantRequestDTO {
    id: string;
    participantId: string;
}
