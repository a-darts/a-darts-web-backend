import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { SocketController } from './SocketController.js';


let io: Server;

export const initializeSocketServer = (
    server: HttpServer,
    socketController: SocketController,
): Server => {
    const allowedOrigins = process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',')
        : ['http://localhost:5173'];

    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
            credentials: true
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
