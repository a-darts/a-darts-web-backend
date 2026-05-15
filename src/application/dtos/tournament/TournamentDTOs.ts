import { RegistrationStatus } from "../../../domain/entities/Registration.js";
import { TournamentStatus } from "../../../domain/entities/Tournament.js";
import { GameModes, GameTypes, ScheduleTypes } from "../../../domain/entities/TournamentInfo.js";

export interface TournamentResponseDTO {
    id: string;
    name: string;
    createdAt: Date;
    status: TournamentStatus;
    info: TournamentInfoDTO;
    registration: RegistrationDTO;
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
    registrationPeriod: RegistrationPeriodDTO;
    registeredParticipantsIds: string[];
}

interface RegistrationPeriodDTO {
    startsAt: Date | null;
    endsAt: Date | null;
}

export interface CreateTournamentRequestDTO {
    name: string;
    info: TournamentInfoDTO;
}

export interface UpdateTournamentStatusRequestDTO {
    id: string;
}

export interface UpdateTournamentInfoRequestDTO {
    id: string;
    newInfo: TournamentInfoDTO;
}

export interface UpdateTournamentNameRequestDTO {
    id: string;
    newName: string;
}

export interface UpdateTournamentRegistrationStatusRequestDTO {
    id: string;
    newRegistrationStatus: RegistrationStatus;
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
