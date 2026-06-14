import { Server as HttpServer } from 'http';
import { globalEventBus } from '../config/eventBus.js';
import { SocketController } from './SocketController.js';
import { initializeSocketServer } from './SocketServer.js';
import { Server } from 'socket.io';
import { MatchAssignedToBoardEvent, MatchCancelledEvent, MatchResumedEvent, MatchSuspendedEvent, MatchUnassignedFromBoardEvent } from '../../domain/events/MatchEvents.js';
import { RedisMatchCacheRepository } from '../persistence/repositories/RedisMatchCacheRepository.js';
import MatchServiceFactory from '../factories/MatchServiceFactory.js';
import { MatchStatus } from '../../domain/entities/Match.js';

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

        globalEventBus.subscribe(MatchUnassignedFromBoardEvent, (event) => {
            if (event.boardShortId) {
                console.log(`[MatchUnassignedFromBoardEvent] Match unassigned from board. Sending match_unassigned to room_board_${event.boardShortId}`);
                io.to(`room_board_${event.boardShortId}`).emit('match_unassigned', {
                    matchId: event.matchId,
                });
            }
        });

        globalEventBus.subscribe(MatchAssignedToBoardEvent, async (event) => {
            if (event.boardShortId) {
                // 1. Actualizamos la diana a la que está asignada el partido en la cache
                await matchCacheRepository.setActiveMatchForBoard(event.boardShortId, event.matchId);

                // 2. Comprobamos el estado del partido
                const status = await matchCacheRepository.getMatchStatus(event.matchId);
                const historyThrows = await matchCacheRepository.getThrows(event.matchId);

                // 2.1. Si el partido está en curso, lo cargamos
                if (status === MatchStatus.IN_PROGRESS) {
                    // 2.1.1. El partido tiene tiradas, enviamos las tiradas
                    if (historyThrows && historyThrows.length > 0) {
                        console.log(`[MatchAssignedToBoardEvent] Match already in progress. Sending match_restored to room_board_${event.boardShortId}`);
                        io.to(`room_board_${event.boardShortId}`).emit('match_restored', {
                            matchId: event.matchId,
                            historyThrows: historyThrows,
                        });
                    }
                    // 2.1.2. El partido aún no tiene tiradas, enviamos una confirmación de que ha comenzado pero sin tiradas
                    else {
                        console.log(`[MatchAssignedToBoardEvent] Match already in progress. Sending match_started_confirmed to room_board_${event.boardShortId}`);
                        io.to(`room_board_${event.boardShortId}`).emit('match_started_confirmed', {
                            matchId: event.matchId,
                        });
                    }
                }

                // 2.2. Si el partido aún no ha empezado, lo lanzamos
                else {
                    console.log(`[MatchAssignedToBoardEvent] Match assigned to board. Sending match_assigned to room_board_${event.boardShortId}`);
                    io.to(`room_board_${event.boardShortId}`).emit('match_assigned', {
                        matchId: event.matchId,
                    });
                }
            }
        });

        // MIRAR: falta MatchStartedEvent

        return io;
    }
}
