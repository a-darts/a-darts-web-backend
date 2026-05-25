import { TournamentRepository } from "../../../../domain/repositories/TournamentRepository.js";
import { TournamentStatus } from "../../../../domain/entities/Tournament.js";

export class ProcessRegistrationPeriods {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    async execute(): Promise<void> {
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
