import { prisma } from '../persistence/client.js';
import { NodeEventBus } from './NodeEventBus.js';
import { PrismaTournamentRepository } from '../persistence/repositories/PrismaTournamentRepository.js';
import { PrismaPlayingAreaRepository } from '../persistence/repositories/PrismaPlayingAreaRepository.js';
import { PrismaBracketRepository } from '../persistence/repositories/PrismaBracketRepository.js';
import { PrismaMatchRepository } from '../persistence/repositories/PrismaMatchRepository.js';
import { PrismaTournamentResultRepository } from '../persistence/repositories/PrismaTournamentResultRepository.js';
import { FinishTournamentOnBracketFinished } from '../../application/subscribers/FinishTournamentOnBracketFinished.js';
import { DeletePlayingAreaOnTournamentFinished } from '../../application/subscribers/DeletePlayingAreaOnTournamentFinished.js';
import { CalculateResultsOnTournamentFinished } from '../../application/subscribers/CalculateResultsOnTournamentFinished.js';

export function configureSubscribers(eventBus: NodeEventBus): void {
    const tournamentRepository = new PrismaTournamentRepository(prisma);
    const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
    const bracketRepository = new PrismaBracketRepository(prisma);
    const matchRepository = new PrismaMatchRepository(prisma);
    const tournamentResultRepository = new PrismaTournamentResultRepository(prisma);
    
    const finishTournamentOnBracketFinished = new FinishTournamentOnBracketFinished(tournamentRepository, eventBus);
    const deletePlayingAreaOnTournamentFinished = new DeletePlayingAreaOnTournamentFinished(playingAreaRepository);
    const calculateResultsOnTournamentFinished = new CalculateResultsOnTournamentFinished(bracketRepository, matchRepository, tournamentResultRepository);

    // Registramos todos los eventos globales aquí
    eventBus.register('tournament.bracket.finished', async (event) => {
        await finishTournamentOnBracketFinished.on(event);
    });

    eventBus.register('tournament.finished', async (event) => {
        await deletePlayingAreaOnTournamentFinished.on(event);
        await calculateResultsOnTournamentFinished.on(event);
    });
}
