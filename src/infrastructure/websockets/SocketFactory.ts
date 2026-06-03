import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { globalEventBus } from '../config/eventBus.js';
import { SocketController } from './SocketController.js';
import { initializeSocketServer } from './SocketServer.js';
import { Server } from 'socket.io';
import { MatchCancelledEvent, MatchResumedEvent, MatchSuspendedEvent } from '../../domain/events/MatchEvents.js';
import { RedisMatchCacheRepository } from '../persistence/repositories/RedisMatchCacheRepository.js';
import MatchServiceFactory from '../factories/MatchServiceFactory.js';

export class SocketFactory {
    static compose(server: HttpServer): Server {
        const matchService = MatchServiceFactory.getInstance();
        const matchCacheRepository = new RedisMatchCacheRepository();

        const socketController = new SocketController(
            matchService,
            matchCacheRepository,
        );

        const io = initializeSocketServer(server, socketController);

        globalEventBus.subscribe(MatchSuspendedEvent, (event) => {
            if (event.boardShortId) {
                console.log(`[MatchSuspendedEvent] Match suspended. Sending match_suspended to room_board_${event.boardShortId}`);
                io.to(`room_board_${event.boardShortId}`).emit('match_suspended', {
                    matchId: event.matchId,
                });
            }
        });

        globalEventBus.subscribe(MatchResumedEvent, (event) => {
            if (event.boardShortId) {
                console.log(`[MatchResumedEvent] Match resumed. Sending match_resumed to room_board_${event.boardShortId}`);
                io.to(`room_board_${event.boardShortId}`).emit('match_resumed', {
                    matchId: event.matchId,
                });
            }
        });

        globalEventBus.subscribe(MatchCancelledEvent, (event) => {
            if (event.boardShortId) {
                console.log(`[MatchCancelledEvent] Match cancelled. Sending match_cancelled to room_board_${event.boardShortId}`);
                io.to(`room_board_${event.boardShortId}`).emit('match_cancelled', {
                    matchId: event.matchId,
                });
            }
        });

        return io;
    }
}
