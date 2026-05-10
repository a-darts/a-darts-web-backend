import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { User } from '../../../domain/entities/User.js';
import { UserMapper } from '../mappers/UserMapper.js';

export class PrismaUserRepository implements UserRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(user: User): Promise<void> {
        const data = UserMapper.toPersistence(user);
        await this.prisma.user.create({ data });
    }

    async update(user: User): Promise<void> {
        const data = UserMapper.toPersistence(user);
        await this.prisma.user.update({
            where: { id: user.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({
            where: { id }
        });
    }

    async findAll(): Promise<User[]> {
        const usersData = await this.prisma.user.findMany();
        return usersData.map(UserMapper.toDomain);
    }

    async findByEmail(email: string): Promise<User | null> {
        const userData = await this.prisma.user.findUnique({ where: { email } });
        return userData ? UserMapper.toDomain(userData) : null;
    }

    async findById(id: string): Promise<User | null> {
        const userData = await this.prisma.user.findUnique({ where: { id } });
        return userData ? UserMapper.toDomain(userData) : null;
    }

    async findManyByIds(ids: string[]): Promise<User[]> {
        const usersData = await this.prisma.user.findMany({
            where: { id: { in: ids } }
        });
        return usersData.map(UserMapper.toDomain);
    }
}
