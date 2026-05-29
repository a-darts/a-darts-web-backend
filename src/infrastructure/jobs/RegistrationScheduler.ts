import cron from 'node-cron';
import { TournamentService } from '../../application/services/TournamentService.js';

export class RegistrationScheduler {
    private cronJob: cron.ScheduledTask | null = null;

    constructor(
        private readonly tournamentService: TournamentService,
    ) { }

    start() {
        if (this.cronJob) {
            return;
        }

        // Run every 5 minutes
        this.cronJob = cron.schedule('*/5 * * * *', async () => {
            await this.tournamentService.processRegistrationPeriods();
        });

        console.log('[RegistrationScheduler] Started cron job (runs every 5 minutes).');
    }

    stop() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.cronJob = null;
            console.log('[RegistrationScheduler] Stopped cron job.');
        }
    }
}
