import {
    Tournament as PrismaTournament,
    RegistrationStatus as PrismaRegistrationStatus,
    TournamentStatus as PrismaTournamentStatus,
} from '@prisma/client';
import { Tournament, TournamentStatus } from '../../../domain/entities/Tournament.js';
import { RegistrationStatus } from '../../../domain/entities/Registration.js';

export class TournamentMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(tournament: Tournament) {
        const info = tournament.getInfo();
        const registration = tournament.getRegistration();

        const tournamentData = {
            id: tournament.getId(),
            name: tournament.getName(),
            createdAt: tournament.getCreatedAt(),
            status: tournament.getStatus() as PrismaTournamentStatus,
            // TournamentInfo fields
            infoPlace: info.getPlace(),
            infoDateTime: info.getDateTime(),
            infoMode: info.getMode(),
            infoGame: info.getGame(),
            infoSchedule: info.getSchedule(),
            infoMaxPlayers: info.getMaxPlayers(),
            infoTypeOfGame: info.getTypeOfGame(),
            infoNumLegs: info.getNumLegs(),
            infoNumSets: info.getNumSets(),
            infoRules: info.getRules(),
            infoInfo: info.getInfo(),
            infoFederation: info.getFederation(),
            //
            // Registration fields
            registrationHasCheckIn: registration.getHasCheckIn(),
            registrationStatus: registration.getStatus() as PrismaRegistrationStatus,
            registrationPeriodStartsAt: registration.getRegistrationPeriod().getStartsAt(),
            registrationPeriodEndsAt: registration.getRegistrationPeriod().getEndsAt(),
            registrationRegisteredParticipantsIds: registration.getRegisteredParticipantsIds(),
            //
        };

        return tournamentData;
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaTournament: PrismaTournament): Tournament {
        return Tournament.rehydrate({
            id: prismaTournament.id,
            name: prismaTournament.name,
            createdAt: prismaTournament.createdAt,
            status: prismaTournament.status as TournamentStatus,

            // Tournament Info
            info: {
                place: prismaTournament.infoPlace,
                dateTime: prismaTournament.infoDateTime,
                mode: prismaTournament.infoMode,
                game: prismaTournament.infoGame,
                schedule: prismaTournament.infoSchedule,
                maxPlayers: prismaTournament.infoMaxPlayers,
                typeOfGame: prismaTournament.infoTypeOfGame,
                numLegs: prismaTournament.infoNumLegs,
                numSets: prismaTournament.infoNumSets,
                rules: prismaTournament.infoRules,
                info: prismaTournament.infoInfo,
                federation: prismaTournament.infoFederation,
            },

            // Registration
            registration: {
                hasCheckIn: prismaTournament.registrationHasCheckIn,
                status: prismaTournament.registrationStatus as RegistrationStatus,
                registrationPeriod: {
                    startsAt: prismaTournament.registrationPeriodStartsAt,
                    endsAt: prismaTournament.registrationPeriodEndsAt,
                },
                registeredParticipantsIds: prismaTournament.registrationRegisteredParticipantsIds || []
            },
        });
    }
}
