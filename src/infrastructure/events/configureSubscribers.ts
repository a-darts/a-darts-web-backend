import { prisma } from '../persistence/client.js';
import { NodeEventBus } from './NodeEventBus.js';
import { PrismaTournamentRepository } from '../persistence/repositories/PrismaTournamentRepository.js';
import { PrismaPlayingAreaRepository } from '../persistence/repositories/PrismaPlayingAreaRepository.js';
import { FinishTournamentOnBracketFinished } from '../../application/subscribers/FinishTournamentOnBracketFinished.js';
import { DeletePlayingAreaOnTournamentFinished } from '../../application/subscribers/DeletePlayingAreaOnTournamentFinished.js';

export function configureSubscribers(eventBus: NodeEventBus): void {
    const tournamentRepository = new PrismaTournamentRepository(prisma);
    const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);

    const finishTournamentOnBracketFinished = new FinishTournamentOnBracketFinished(tournamentRepository, eventBus);
    const deletePlayingAreaOnTournamentFinished = new DeletePlayingAreaOnTournamentFinished(playingAreaRepository);

    eventBus.register('tournament.bracket.finished', async (event) => {
        await finishTournamentOnBracketFinished.on(event);
    });

    eventBus.register('tournament.finished', async (event) => {
        await deletePlayingAreaOnTournamentFinished.on(event);
    });
}
