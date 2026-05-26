import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MatchStateCache } from '../cache/MatchStateCache.js';

let io: Server;

export const initializeSocketServer = (server: HttpServer): void => {
    io = new Server(server, {
        cors: {
            origin: '*', // MIRAR: En producción debería restringirse
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.on('join_board', async (boardId: string) => {
            // Unirse a la sala lógica del board
            const roomName = `room_board_${boardId}`;
            await socket.join(roomName);
            console.log(`[SocketServer] Client ${socket.id} successfully joined ${roomName}`);

            // MIRAR: emitir el historial actual si hay un partido activo
            try {
                const matchId = await MatchStateCache.getActiveMatchForBoard(boardId);
                if (matchId) {
                    console.log(`[SocketServer] Diana ${boardId} ya tiene el partido ${matchId} asignado. Notificando al cliente...`);
                    socket.emit('match_assigned', { matchId });
                }

            } catch (error) {
                console.error(`[SocketServer] Error al verificar partido activo en la diana ${boardId}:`, error);
            }
        });

        socket.on('score_update', async (data: { boardId: string, matchId: string, throwData: any }) => {
            const { boardId, matchId, throwData } = data;
            console.log(`[SocketServer] Received score_update ${throwData.score} from matchId: ${matchId} and boardId: ${boardId}`);

            // Guardar en Redis
            await MatchStateCache.addThrow(matchId, throwData);

            // Retransmitir a los clientes en la sala (incluyendo la web app)
            const roomName = `room_board_${boardId}`;
            socket.to(roomName).emit('score_update', { matchId, throwData });
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
