import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MatchStateCache } from '../cache/MatchStateCache.js';

let io: Server;

export const initializeSocketServer = (server: HttpServer): void => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join_board', async (boardId: string) => {
            const roomName = `room_board_${boardId}`;
            await socket.join(roomName);
            console.log(`[SocketServer] Client ${socket.id} successfully joined ${roomName}`);

            try {
                const matchId = await MatchStateCache.getActiveMatchForBoard(boardId);
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
                console.error(`[SocketServer] Error al verificar partido activo en la diana ${boardId}:`, error);
            }
        });

        socket.on('score_update', async (data: { boardId: string, matchId: string, throwData: any }) => {
            const { boardId, matchId, throwData } = data;
            console.log(`[SocketServer] Received score_update para matchId: ${matchId}`);
            console.log(`[SocketServer] ${throwData.score}, ${throwData.status}, activeIndex: ${throwData.activePlayerIndex}, throwerIndex: ${throwData.throwerPlayerIndex}, ${throwData.participant1.remainingScore}, ${throwData.participant2.remainingScore}`);

            try {
                // Guardar la tirada actual en la lista de Redis
                await MatchStateCache.addThrow(matchId, throwData);

                // Retransmitimos a la web el último tiro
                const roomName = `room_board_${boardId}`;
                socket.to(roomName).emit('score_update', {
                    matchId,
                    throwData,
                });
            } catch (error) {
                console.error(`[SocketServer] Error procesando score_update:`, error);
            }
        });

        socket.on('score_undo', async (data: { boardId: string, matchId: string }) => {
            const { boardId, matchId } = data;
            console.log(`[SocketServer] Received score_undo para matchId: ${matchId}`);

            try {
                // 1. Eliminamos el último registro de Redis
                await MatchStateCache.removeLastThrow(matchId);

                // 2. Obtenemos cómo quedó el historial actual tras el borrado
                const remainingThrows = await MatchStateCache.getThrows(matchId);

                // 3. Retransmitimos a la sala web el evento informando el nuevo historial
                const roomName = `room_board_${boardId}`;
                socket.to(roomName).emit('score_undo_confirmed', {
                    matchId,
                    historyThrows: remainingThrows
                });
            } catch (error) {
                console.error(`[SocketServer] Error procesando match_undo:`, error);
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
