import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { PrismaMatchRepository } from '../persistence/repositories/PrismaMatchRepository.js';
import { PrismaUnitOfWork } from '../persistence/PrismaUnitOfWork.js';
import { PrismaBracketRepository } from '../persistence/repositories/PrismaBracketRepository.js';
import { PrismaPlayingAreaRepository } from '../persistence/repositories/PrismaPlayingAreaRepository.js';
import { SingleEliminationMatchGenerator } from '../../domain/services/SingleEliminationMatchGenerator.js';
import { UpdateMatchScore } from '../../application/services/tournament/matches/UpdateMatchScore.js';
import { FinishMatch } from '../../application/services/tournament/matches/status/FinishMatch.js';
import { globalEventBus } from '../events/eventBusInstance.js';
import { SocketController } from './SocketController.js';
import { initializeSocketServer } from './SocketServer.js';
import { Server } from 'socket.io';

export class SocketFactory {
    static compose(server: HttpServer, prisma: PrismaClient): Server {
        const matchRepository = new PrismaMatchRepository(prisma);
        const unitOfWork = new PrismaUnitOfWork(prisma);
        const bracketRepository = new PrismaBracketRepository(prisma);
        const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
        const matchGenerator = new SingleEliminationMatchGenerator();

        const updateMatchScoreUseCase = new UpdateMatchScore(matchRepository);
        const finishMatchUseCase = new FinishMatch(
            unitOfWork,
            matchRepository,
            bracketRepository,
            playingAreaRepository,
            matchGenerator,
            globalEventBus,
        );

        const socketController = new SocketController(
            updateMatchScoreUseCase,
            finishMatchUseCase,
        );

        return initializeSocketServer(server, socketController);
    }
}
