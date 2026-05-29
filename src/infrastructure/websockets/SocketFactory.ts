import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { globalEventBus } from '../events/eventBusInstance.js';
import { SocketController } from './SocketController.js';
import { initializeSocketServer } from './SocketServer.js';
import { Server } from 'socket.io';
import { MatchResumedEvent, MatchSuspendedEvent } from '../../domain/events/MatchEvents.js';
import { RedisMatchCacheRepository } from '../persistence/repositories/RedisMatchCacheRepository.js';
import MatchServiceFactory from '../factories/MatchServiceFactory.js';

export class SocketFactory {
    static compose(server: HttpServer, prisma: PrismaClient): Server {
        const matchService = MatchServiceFactory.getInstance();
        const matchCacheRepository = new RedisMatchCacheRepository();

        const socketController = new SocketController(
            matchService,
            matchCacheRepository,
        );

        const io = initializeSocketServer(server, socketController);

        globalEventBus.subscribe(MatchSuspendedEvent, (event) => {
            io.to(`room_board_${event.boardShortId}`).emit('match_suspended', {
                matchId: event.matchId,
            });
        });

        globalEventBus.subscribe(MatchResumedEvent, (event) => {
            io.to(`room_board_${event.boardShortId}`).emit('match_resumed', {
                matchId: event.matchId,
            });
        });

        return io;
    }
}
