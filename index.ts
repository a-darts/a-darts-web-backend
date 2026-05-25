import 'dotenv/config';
import app from './app.js';
import { prisma } from './src/infrastructure/persistence/client.js';

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

        app.listen(PORT, () => {
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
