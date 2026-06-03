import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { prisma } from './src/infrastructure/persistence/prismaClient.js';
import { SocketFactory } from './src/infrastructure/websockets/SocketFactory.js';
import { RegistrationScheduler } from './src/infrastructure/jobs/RegistrationScheduler.js';
import { TournamentService } from './src/application/services/TournamentService.js';
import { PrismaTournamentRepository } from './src/infrastructure/persistence/repositories/PrismaTournamentRepository.js';
import TournamentServiceFactory from './src/infrastructure/factories/TournamentServiceFactory.js';

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
        const tournamentService = TournamentServiceFactory.getInstance();
        const registrationScheduler = new RegistrationScheduler(tournamentService);
        registrationScheduler.start();
        //

        const server = http.createServer(app);

        SocketFactory.compose(server);

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
