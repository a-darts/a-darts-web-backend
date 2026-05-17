import { Tournament } from '../../../domain/entities/Tournament.js';
import { TournamentResponseDTO } from './TournamentDTOs.js';

export class TournamentMapper {
    public static toResponse(tournament: Tournament): TournamentResponseDTO {
        const tournamentInfo = tournament.getInfo();
        const registration = tournament.getRegistration();

        const tournamentData = {
            id: tournament.getId(),
            name: tournament.getName(),
            seasonStartYear: tournament.getSeason().getStartYear(),
            createdAt: tournament.getCreatedAt(),
            status: tournament.getStatus(),
            hasBracket: tournament.getHasBracket(),
            info: {
                place: tournamentInfo.getPlace(),
                dateTime: tournamentInfo.getDateTime(),
                mode: tournamentInfo.getMode(),
                game: tournamentInfo.getGame(),
                schedule: tournamentInfo.getSchedule(),
                maxPlayers: tournamentInfo.getMaxPlayers(),
                gameType: tournamentInfo.getGameType(),
                numLegs: tournamentInfo.getNumLegs(),
                numSets: tournamentInfo.getNumSets(),
                rules: tournamentInfo.getRules(),
                info: tournamentInfo.getInfo(),
                federation: tournamentInfo.getFederation(),
            },
            registration: {
                hasCheckIn: registration.getHasCheckIn(),
                status: registration.getStatus(),
                registrationPeriod: {
                    startsAt: registration.getRegistrationPeriod().getStartsAt(),
                    endsAt: registration.getRegistrationPeriod().getEndsAt(),
                },
                registeredParticipantsIds: registration.getRegisteredParticipantsIds(),
            },
        };

        return tournamentData;
    }
}
