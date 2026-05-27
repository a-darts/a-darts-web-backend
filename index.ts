import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { prisma } from './src/infrastructure/persistence/client.js';
import { UpdateMatchScore } from './src/application/services/tournament/matches/UpdateMatchScore.js';
import { PrismaMatchRepository } from './src/infrastructure/persistence/repositories/PrismaMatchRepository.js';
import { FinishMatch } from './src/application/services/tournament/matches/status/FinishMatch.js';
import { PrismaUnitOfWork } from './src/infrastructure/persistence/PrismaUnitOfWork.js';
import { PrismaBracketRepository } from './src/infrastructure/persistence/repositories/PrismaBracketRepository.js';
import { PrismaPlayingAreaRepository } from './src/infrastructure/persistence/repositories/PrismaPlayingAreaRepository.js';
import { SingleEliminationMatchGenerator } from './src/domain/services/SingleEliminationMatchGenerator.js';
import { globalEventBus } from './src/infrastructure/events/eventBusInstance.js';
import { SocketController } from './src/infrastructure/websockets/SocketController.js';
import { initializeSocketServer } from './src/infrastructure/websockets/SocketServer.js';
import { SocketFactory } from './src/infrastructure/websockets/SocketFactory.js';

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log('Checking environment variables...');
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        console.log('Checking database connection...');
        await prisma.$connect();
        console.log('Database connection established successfully.');

        // Start background jobs
        const { registrationScheduler } = await import('./src/infrastructure/jobs/RegistrationScheduler.js');
        registrationScheduler.start();

        const server = http.createServer(app);

        SocketFactory.compose(server, prisma);

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to connect to the database:');
        console.error(error);
        process.exit(1);
    }
}

startServer();
