import { PrismaClient } from '@prisma/client';
import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { Player } from '../../../domain/entities/Player.js';
import { PlayerMapper } from '../mappers/PlayerMapper.js';

export class PrismaPlayerRepository implements PlayerRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(player: Player): Promise<void> {
        const data = PlayerMapper.toPersistence(player);
        await this.prisma.player.create({ data });
    }

    async update(player: Player): Promise<void> {
        const data = PlayerMapper.toPersistence(player);
        await this.prisma.player.update({
            where: { userId: player.getUserId() },
            data,
        });
    }

    async delete(userId: string): Promise<void> {
        await this.prisma.player.delete({
            where: { userId }
        });
    }

    async findAll(): Promise<Player[]> {
        const playersData = await this.prisma.player.findMany();
        return playersData.map(PlayerMapper.toDomain);
    }

    async findByUserId(userId: string): Promise<Player | null> {
        const playersData = await this.prisma.player.findUnique({ where: { userId } });
        return playersData ? PlayerMapper.toDomain(playersData) : null;
    }
}
