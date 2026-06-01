import { PrismaClient } from '@prisma/client';
import { UnitOfWork } from '../../domain/ports/services/UnitOfWork.js';
import { transactionStorage } from './TransactionContext.js';

export class PrismaUnitOfWork implements UnitOfWork {
    constructor(private readonly prisma: PrismaClient) { }

    async transaction<T>(work: () => Promise<T>): Promise<T> {
        return await this.prisma.$transaction(async (tx) => {
            return await transactionStorage.run(tx, async () => {
                return await work();
            });
        });
    }
}
