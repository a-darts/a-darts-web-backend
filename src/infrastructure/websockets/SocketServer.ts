import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { MatchStateCache } from '../cache/MatchStateCache.js';

let io: Server;

export const initializeSocketServer = (server: HttpServer): void => {
    io = new Server(server, {
        cors: {
            origin: '*', // En producción debería restringirse
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

            // Opcional: Podríamos emitir el historial actual si hay un partido activo
            // const matchId = await MatchStateCache.getActiveMatchForBoard(boardId);
            // if (matchId) {
            //     const throws = await MatchStateCache.getThrows(matchId);
            //     socket.emit('match_state_sync', throws);
            // }
        });

        socket.on('score_update', async (data: { boardId: string, matchId: string, throwData: any }) => {
            const { boardId, matchId, throwData } = data;

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
