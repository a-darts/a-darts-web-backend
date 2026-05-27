import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { SocketController } from './SocketController.js';


let io: Server;

export const initializeSocketServer = (
    server: HttpServer,
    socketController: SocketController,
): Server => {
    io = new Server(server, {
        cors: {
            origin: '*', // MIRAR: cambiar en producción
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Client connected: ${socket.id}`);
        socketController.handleConnection(socket, io);
    });

    return io;
};

export const getSocketServer = (): Server => {
    if (!io) {
        throw new Error('Socket.io has not been initialized.');
    }

    return io;
};
