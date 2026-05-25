import cron from 'node-cron';
import { ProcessRegistrationPeriods } from '../../application/services/tournament/registration/ProcessRegistrationPeriods.js';
import { PrismaTournamentRepository } from '../persistence/repositories/PrismaTournamentRepository.js';
import { prisma } from '../persistence/client.js';

export class RegistrationScheduler {
    private cronJob: cron.ScheduledTask | null = null;

    constructor(private readonly processRegistrationPeriods: ProcessRegistrationPeriods) { }

    start() {
        if (this.cronJob) {
            return;
        }

        // Run every 5 minutes
        this.cronJob = cron.schedule('*/5 * * * *', async () => {
            await this.processRegistrationPeriods.execute();
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

// Singleton export for easy initialization
const tournamentRepository = new PrismaTournamentRepository(prisma);
const processRegistrationPeriods = new ProcessRegistrationPeriods(tournamentRepository);
export const registrationScheduler = new RegistrationScheduler(processRegistrationPeriods);
