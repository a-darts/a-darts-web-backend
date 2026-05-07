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
            where: { id: player.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.player.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Player[]> {
        const playersData = await this.prisma.player.findMany();
        return playersData.map(PlayerMapper.toDomain);
    }

    async findById(id: string): Promise<Player | null> {
        const playersData = await this.prisma.player.findUnique({ where: { id } });
        return playersData ? PlayerMapper.toDomain(playersData) : null;
    }

    async findByUserIdAndSeason(userId: string, seasonStartYear: number): Promise<Player | null> {
        const playersData = await this.prisma.player.findUnique({
            where: { userId_seasonStartYear: { userId, seasonStartYear } }
        });
        return playersData ? PlayerMapper.toDomain(playersData) : null;
    }

    async findAllByUserId(userId: string): Promise<Player[]> {
        const playersData = await this.prisma.player.findMany({
            where: { userId }
        });
        return playersData.map(PlayerMapper.toDomain);
    }
}
