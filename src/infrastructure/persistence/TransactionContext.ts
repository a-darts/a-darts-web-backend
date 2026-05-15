import { Prisma } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

// Almacén de la instancia 'tx' de Prisma
export const transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>();
