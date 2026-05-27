import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MatchStateCache } from '../cache/MatchStateCache.js';
import { UpdateMatchScore } from '../../application/services/tournament/matches/UpdateMatchScore.js';


let io: Server;

export const initializeSocketServer = (
    server: HttpServer,
    updateMatchScoreUseCase: UpdateMatchScore,
): void => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join_board', async (boardShortId: string) => {
            const roomName = `room_board_${boardShortId}`;
            await socket.join(roomName);
            console.log(`[SocketServer] Client ${socket.id} successfully joined ${roomName}`);

            try {
                const matchId = await MatchStateCache.getActiveMatchForBoard(boardShortId);
                if (matchId) {
                    // Recuperamos todo el historial de tiradas acumuladas
                    const status = await MatchStateCache.getMatchStatus(matchId);
                    const historyThrows = await MatchStateCache.getThrows(matchId);

                    if (status === 'IN_PROGRESS') {
                        console.log(`[SocketServer] Partida IN_PROGRESS confirmada por estado. Restaurando cliente ${socket.id}`);
                        socket.emit('match_restored', { matchId, historyThrows });
                    } else {
                        console.log(`[SocketServer] Partido READY confirmado por estado. Asignando al cliente ${socket.id}`);
                        socket.emit('match_assigned', { matchId });
                    }
                }
            } catch (error) {
                console.error(`[SocketServer] Error al verificar partido activo en la diana ${boardShortId}:`, error);
            }
        });

        socket.on('score_update', async (data: { boardShortId: string, matchId: string, throwData: any }) => {
            const { boardShortId, matchId, throwData } = data;
            console.log(`[SocketServer] Received score_update para matchId: ${matchId} y boardShortId: ${boardShortId}`);
            console.log(`[SocketServer] ${throwData.score}, ${throwData.status}, activeIndex: ${throwData.activePlayerIndex}, throwerIndex: ${throwData.throwerPlayerIndex}, ${throwData.participant1.remainingScore}, ${throwData.participant2.remainingScore}`);

            try {
                // Obtenemos el ultimo estado
                const lastThrow = await MatchStateCache.getLastThrow(matchId);

                // Guardar la tirada actual en la lista de Redis
                await MatchStateCache.addThrow(matchId, throwData);

                const hasScoreChanged = !lastThrow || 
                    throwData.participant1.legsWon !== lastThrow.participant1.legsWon ||
                    throwData.participant1.setsWon !== lastThrow.participant1.setsWon ||
                    throwData.participant2.legsWon !== lastThrow.participant2.legsWon ||
                    throwData.participant2.setsWon !== lastThrow.participant2.setsWon;

                if (hasScoreChanged) {
                    console.log(`[SocketServer] Cambio de marcador detectado en ${matchId}. Persistiendo...`);
                    await updateMatchScoreUseCase.execute({
                        id: matchId,
                        participant1Sets: throwData.participant1.setsWon,
                        participant1Legs: throwData.participant1.legsWon,
                        participant2Sets: throwData.participant2.setsWon,
                        participant2Legs: throwData.participant2.legsWon,
                    });
                }

                // Retransmitimos a la web el último tiro
                const roomName = `room_board_${boardShortId}`;
                socket.to(roomName).emit('score_update', {
                    matchId,
                    throwData,
                });
            } catch (error) {
                console.error(`[SocketServer] Error procesando score_update:`, error);
            }
        });

        socket.on('score_undo', async (data: { boardShortId: string, matchId: string }) => {
            const { boardShortId, matchId } = data;
            console.log(`[SocketServer] Received score_undo para matchId: ${matchId}`);

            try {
                // 1. Eliminamos el último registro de Redis
                await MatchStateCache.removeLastThrow(matchId);

                // 2. Obtenemos cómo quedó el historial actual tras el borrado
                const remainingThrows = await MatchStateCache.getThrows(matchId);

                // 3. Retransmitimos a la sala web el evento informando el nuevo historial
                const roomName = `room_board_${boardShortId}`;
                socket.to(roomName).emit('score_undo_confirmed', {
                    matchId,
                    historyThrows: remainingThrows
                });
            } catch (error) {
                console.error(`[SocketServer] Error procesando match_undo:`, error);
            }
        });

        socket.on('score_edit', async (data: { boardShortId: string, matchId: string, historyThrows: any[] }) => {
            const { boardShortId, matchId, historyThrows } = data;
            console.log(`[SocketServer] Recibida edición de tiro para matchId: ${matchId}. Reconstruyendo caché...`);
            console.log("HistoryThrows:", historyThrows);
            try {
                if (!historyThrows || historyThrows.length === 0) {
                    console.warn(`[SocketServer] Historial recibido vacío para matchId: ${matchId}`);
                    return;
                }

                // 1. Obtenemos el último estado modificado para actualizar los widgets/pantallas principales
                const latestThrow = historyThrows[historyThrows.length - 1];

                // 2. Sobrescribimos el historial de Redis en bloque de forma segura
                await MatchStateCache.rebuildHistory(matchId, historyThrows);

                // 3. Retransmitimos a la sala de la diana
                const roomName = `room_board_${boardShortId}`;
                io.to(roomName).emit('score_edit_confirmed', {
                    matchId,
                    throwData: latestThrow,
                    historyThrows: historyThrows,
                });

                console.log(`[SocketServer] score_edit_confirmed emitido con éxito a la sala ${roomName}`);

            } catch (error) {
                console.error(`[SocketServer] Error procesando score_edit:`, error);
            }
        });

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

export const getSocketServer = (): Server => {
    if (!io) {
        throw new Error('Socket.io has not been initialized.');
    }
    return io;
};
