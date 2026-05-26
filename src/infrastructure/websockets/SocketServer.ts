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
                    const historyThrows = await MatchStateCache.getThrows(matchId);
                    if (historyThrows && historyThrows.length > 0) {
                        console.log(`[SocketServer] Partida IN_PROGRESS detectada (${historyThrows.length} tiros). Enviando auto-restauración al cliente ${socket.id}`);
                        socket.emit('match_restored', { matchId, historyThrows });
                    } else {
                        console.log(`[SocketServer] Partido READY detectada. Enviando al cliente ${socket.id}`);
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

            try {
                // DETECCIÓN DE REINICIO DE LEG:
                // Si es el primer tiro o las puntuaciones de ambos vuelven a ser 501 (o el valor inicial), 
                // significa que el cliente móvil reinició el Leg. Vaciamos la lista en Redis.
                const isNewLeg = throwData.participant1?.remainingScore === 501 &&
                    throwData.participant2?.remainingScore === 501 &&
                    throwData.score === 0; // O la condición de victoria/reinicio de tu cliente móvil

                if (isNewLeg) {
                    console.log(`[SocketServer] ¡Detectado nuevo Leg! Limpiando tiradas anteriores.`);
                    await MatchStateCache.clearMatch(matchId);
                }

                // Guardar la tirada actual en la lista de Redis
                await MatchStateCache.addThrow(matchId, throwData);

                // Recuperamos toda la lista actualizada del Leg actual
                const historyThrows = await MatchStateCache.getThrows(matchId);

                // Retransmitimos a la web TODO el historial junto al último tiro
                const roomName = `room_board_${boardId}`;
                socket.to(roomName).emit('score_update', {
                    matchId,
                    throwData,          // El estado instantáneo actual
                    historyThrows       // Todas las tiradas del leg acumuladas
                });
            } catch (error) {
                console.error(`[SocketServer] Error procesando score_update:`, error);
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
