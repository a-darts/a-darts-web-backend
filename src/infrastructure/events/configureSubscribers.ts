import { prisma } from '../persistence/prismaClient.js';
import { NodeEventBus } from './NodeEventBus.js';
import { PrismaTournamentRepository } from '../persistence/repositories/PrismaTournamentRepository.js';
import { PrismaPlayingAreaRepository } from '../persistence/repositories/PrismaPlayingAreaRepository.js';
import { PrismaBracketRepository } from '../persistence/repositories/PrismaBracketRepository.js';
import { PrismaMatchRepository } from '../persistence/repositories/PrismaMatchRepository.js';
import { PrismaTournamentResultRepository } from '../persistence/repositories/PrismaTournamentResultRepository.js';
import { FinishTournamentOnBracketFinished } from '../../application/handlers/FinishTournamentOnBracketFinished.js';
import { DeletePlayingAreaOnTournamentFinished } from '../../application/handlers/DeletePlayingAreaOnTournamentFinished.js';
import { CalculateResultsOnTournamentFinished } from '../../application/handlers/CalculateResultsOnTournamentFinished.js';
import { UpdateCacheOnMatchFinished } from '../../application/handlers/UpdateCacheOnMatchFinished.js';
import { RedisMatchCacheRepository } from '../persistence/repositories/RedisMatchCacheRepository.js';

export function configureSubscribers(eventBus: NodeEventBus): void {
    const tournamentRepository = new PrismaTournamentRepository(prisma);
    const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
    const bracketRepository = new PrismaBracketRepository(prisma);
    const matchRepository = new PrismaMatchRepository(prisma);
    const tournamentResultRepository = new PrismaTournamentResultRepository(prisma);
    const matchCacheRepository = new RedisMatchCacheRepository();

    const finishTournamentOnBracketFinished = new FinishTournamentOnBracketFinished(tournamentRepository, eventBus);
    const deletePlayingAreaOnTournamentFinished = new DeletePlayingAreaOnTournamentFinished(playingAreaRepository);
    const calculateResultsOnTournamentFinished = new CalculateResultsOnTournamentFinished(bracketRepository, matchRepository, tournamentResultRepository);
    const updateCacheOnMatchFinished = new UpdateCacheOnMatchFinished(matchCacheRepository);

    // Registramos todos los eventos globales aquí
    eventBus.register('bracket.finished', async (event) => {
        await finishTournamentOnBracketFinished.on(event);
    });

    eventBus.register('tournament.finished', async (event) => {
        await deletePlayingAreaOnTournamentFinished.on(event);
        await calculateResultsOnTournamentFinished.on(event);
    });

    eventBus.register('match.finished', async (event) => {
        await updateCacheOnMatchFinished.on(event);
    });
}
