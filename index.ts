import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { prisma } from './src/infrastructure/persistence/client.js';
import { MatchRepository } from './src/domain/repositories/MatchRepository.js';
import { UpdateMatchScore } from './src/application/services/tournament/matches/UpdateMatchScore.js';
import { PrismaMatchRepository } from './src/infrastructure/persistence/repositories/PrismaMatchRepository.js';
import { FinishMatch } from './src/application/services/tournament/matches/status/FinishMatch.js';
import { PrismaUnitOfWork } from './src/infrastructure/persistence/PrismaUnitOfWork.js';
import { PrismaBracketRepository } from './src/infrastructure/persistence/repositories/PrismaBracketRepository.js';
import { PrismaPlayingAreaRepository } from './src/infrastructure/persistence/repositories/PrismaPlayingAreaRepository.js';
import { SingleEliminationMatchGenerator } from './src/domain/services/SingleEliminationMatchGenerator.js';
import { globalEventBus } from './src/infrastructure/events/eventBusInstance.js';

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

        // Inicialización del servidor de WebSockets
        // 1. Instanciamos los repositorios y casos de uso
        const matchRepository = new PrismaMatchRepository(prisma); 
        const updateMatchScoreUseCase = new UpdateMatchScore(matchRepository);

        const unitOfWork = new PrismaUnitOfWork(prisma);
        const bracketRepository = new PrismaBracketRepository(prisma);
        const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
        const matchGenerator = new SingleEliminationMatchGenerator();
        const finishMatchUseCase = new FinishMatch(unitOfWork, matchRepository, bracketRepository, playingAreaRepository, matchGenerator, globalEventBus);

        const server = http.createServer(app);
        
        // 2. Pasamos el caso de uso al inicializador
        const { initializeSocketServer } = await import('./src/infrastructure/websockets/SocketServer.js');
        initializeSocketServer(server, updateMatchScoreUseCase, finishMatchUseCase);

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
