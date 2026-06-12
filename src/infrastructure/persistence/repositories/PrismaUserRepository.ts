import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../../domain/ports/repositories/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';
import { UserMapper } from '../mappers/UserMapper.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private get client() {
        const tx = transactionStorage.getStore();
        if (tx) {
            return tx;
        }
        return this.prisma;
    }

    async create(user: User): Promise<void> {
        const data = UserMapper.toPersistence(user);
        await this.client.user.create({ data });
    }

    async update(user: User): Promise<void> {
        const data = UserMapper.toPersistence(user);
        await this.client.user.update({
            where: { id: user.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.user.delete({
            where: { id }
        });
    }

    async findAll(skip?: number, take?: number, filters?: { search?: string; status?: string; role?: string }): Promise<User[]> {
        const where: any = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.role) {
            where.role = filters.role;
        }
        if (filters?.search) {
            where.OR = [
                { alias: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        const usersData = await this.client.user.findMany({
            where,
            skip,
            take,
        });
        return usersData.map(UserMapper.toDomain);
    }

    async count(filters?: { search?: string; status?: string; role?: string }): Promise<number> {
        const where: any = {};
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.role) {
            where.role = filters.role;
        }
        if (filters?.search) {
            where.OR = [
                { alias: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.client.user.count({
            where,
        });
    }

    async findByEmail(email: string): Promise<User | null> {
        const userData = await this.client.user.findUnique({ where: { email } });
        return userData ? UserMapper.toDomain(userData) : null;
    }

    async findById(id: string): Promise<User | null> {
        const userData = await this.client.user.findUnique({ where: { id } });
        return userData ? UserMapper.toDomain(userData) : null;
    }

    async findManyByIds(ids: string[]): Promise<User[]> {
        const usersData = await this.client.user.findMany({
            where: { id: { in: ids } }
        });
        return usersData.map(UserMapper.toDomain);
    }
}
