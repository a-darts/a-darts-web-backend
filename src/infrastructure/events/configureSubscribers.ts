import { prisma } from '../persistence/client.js';
import { NodeEventBus } from './NodeEventBus.js';
import { PrismaTournamentRepository } from '../persistence/repositories/PrismaTournamentRepository.js';
import { FinishTournamentOnBracketFinished } from '../../application/subscribers/FinishTournamentOnBracketFinished.js';

export function configureSubscribers(eventBus: NodeEventBus): void {
    const tournamentRepository = new PrismaTournamentRepository(prisma);
    const finishTournamentOnBracketFinished = new FinishTournamentOnBracketFinished(tournamentRepository);

    // Registramos todos los eventos globales aquí
    eventBus.register('tournament.bracket.finished', async (event) => {
        await finishTournamentOnBracketFinished.on(event);
    });
}
