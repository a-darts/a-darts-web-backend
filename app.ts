import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import router from './src/infrastructure/web/routes/index.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', router);

// Error Handling (Basic)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

export default app;
