import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import router from './src/infrastructure/web/routes/index.js';
import { specs } from './src/infrastructure/web/swagger.js';
import { ApiResponseBuilder } from './src/application/dtos/common/ApiResponse.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use('/api', router);

// Error Handling (Basic)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json(
        ApiResponseBuilder.error('Internal server error')
    );
});

export default app;
