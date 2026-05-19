import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { User } from '../../../domain/entities/User.js';
import { UserMapper } from '../mappers/UserMapper.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaUserRepository implements UserRepository {
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

    async findAll(skip?: number, take?: number): Promise<User[]> {
        const usersData = await this.client.user.findMany({
            skip,
            take,
        });
        return usersData.map(UserMapper.toDomain);
    }

    async count(): Promise<number> {
        return this.client.user.count();
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
