import { TournamentStatus } from "../../domain/entities/Tournament.js";
import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { IBracketRepository } from "../../domain/repositories/IBracketRepository.js";
import { TournamentRepository } from "../../domain/repositories/TournamentRepository.js";
import { UpdateTournamentRegistrationPeriodRequestDTO } from "../dtos/tournament/TournamentDTOs.js";


export class TournamentService {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly bracketRepository: IBracketRepository,
    ) { }


    public async openRegistration(id: string): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check the tournament does not have a bracket
        const bracket = await this.bracketRepository.findByTournamentId(id);
        if (bracket) {
            throw new TournamentAlreadyHasBracketException();
        }

        // 3. Open the registration in the tournament object
        tournament.openRegistration();

        // 4. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
    }


    public async closeRegistration(id: string): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Open the registration in the tournament object
        tournament.closeRegistration();

        // 3. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
    }


    public async updateRegistrationPeriod(request: UpdateTournamentRegistrationPeriodRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check the tournament does not have a bracket
        const bracket = await this.bracketRepository.findByTournamentId(request.id);
        if (bracket) {
            throw new TournamentAlreadyHasBracketException();
        }

        // 3. Update the registration period in the tournament object
        tournament.scheduleRegistration(
            request.newRegistrationPeriod.startsAt,
            request.newRegistrationPeriod.endsAt,
        );

        // 4. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
    }


    public async processRegistrationPeriods(): Promise<void> {
        try {
            const tournaments = await this.tournamentRepository.findAll();
            const publishedTournaments = tournaments.filter(t => t.getStatus() === TournamentStatus.PUBLISHED);

            for (const tournament of publishedTournaments) {
                const registration = tournament.getRegistration();
                const period = registration.getRegistrationPeriod();

                // If period is open but registration is closed, open it
                if (period.isOpen() && registration.isClosed()) {
                    tournament.openRegistration();
                    await this.tournamentRepository.update(tournament);
                    console.log(`[RegistrationScheduler] Opened registration for tournament ${tournament.getId()} (${tournament.getName()})`);
                }

                // If period is closed but registration is open, close it
                if (period.isClosed() && registration.isOpen()) {
                    tournament.closeRegistration();
                    await this.tournamentRepository.update(tournament);
                    console.log(`[RegistrationScheduler] Closed registration for tournament ${tournament.getId()} (${tournament.getName()})`);
                }
            }
        } catch (error) {
            console.error('[RegistrationScheduler] Error processing registration periods:', error);
        }
    }
}