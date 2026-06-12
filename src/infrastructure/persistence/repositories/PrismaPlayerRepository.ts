import { PrismaClient } from '@prisma/client';
import { IPlayerRepository, PlayerWithUser } from '../../../domain/ports/repositories/IPlayerRepository.js';
import { Player, PlayerStatus } from '../../../domain/entities/Player.js';
import { PlayerMapper } from '../mappers/PlayerMapper.js';
import { transactionStorage } from '../TransactionContext.js';
import { UserMapper } from '../mappers/UserMapper.js';

export class PrismaPlayerRepository implements IPlayerRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private get client() {
        const tx = transactionStorage.getStore();
        if (tx) {
            return tx;
        }
        return this.prisma;
    }

    async create(player: Player): Promise<void> {
        const data = PlayerMapper.toPersistence(player);
        await this.client.player.create({ data });
    }

    async update(player: Player): Promise<void> {
        const data = PlayerMapper.toPersistence(player);
        await this.client.player.update({
            where: { id: player.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.player.delete({
            where: { id }
        });
    }

    async findAll(skip?: number, take?: number, search?: string, status: PlayerStatus = PlayerStatus.ACTIVE, federation?: string, seasonStartYear?: number): Promise<Player[]> {
        const where: any = { status };
        if (federation) {
            where.federation = federation;
        }
        if (seasonStartYear !== undefined) {
            where.seasonStartYear = seasonStartYear;
        }
        if (search) {
            where.OR = [
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { user: { alias: { contains: search, mode: 'insensitive' } } }
            ]
        }

        const playersData = await this.client.player.findMany({
            where,
            skip,
            take,
        });
        return playersData.map(PlayerMapper.toDomain);
    }

    async findAllWithUser(skip?: number, take?: number, search?: string, status: PlayerStatus = PlayerStatus.ACTIVE, federation?: string, seasonStartYear?: number): Promise<PlayerWithUser[]> {
        const where: any = { status };
        if (federation) {
            where.federation = federation;
        }
        if (seasonStartYear !== undefined) {
            where.seasonStartYear = seasonStartYear;
        }
        if (search) {
            where.OR = [
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { user: { alias: { contains: search, mode: 'insensitive' } } }
            ]
        }

        const playersData = await this.client.player.findMany({
            where,
            skip,
            take,
            include: {
                user: true,
            },
        });
        return playersData.map(data => ({
            player: PlayerMapper.toDomain(data),
            user: UserMapper.toDomain(data.user),
        }));
    }

    async count(search?: string, status: PlayerStatus = PlayerStatus.ACTIVE, federation?: string, seasonStartYear?: number): Promise<number> {
        const where: any = { status };
        if (federation) {
            where.federation = federation;
        }
        if (seasonStartYear !== undefined) {
            where.seasonStartYear = seasonStartYear;
        }
        if (search) {
            where.OR = [
                { registrationNumber: { contains: search, mode: 'insensitive' } },
                { user: { alias: { contains: search, mode: 'insensitive' } } }
            ]
        }

        return this.client.player.count({
            where,
        });
    }

    async findById(id: string): Promise<Player | null> {
        const playersData = await this.client.player.findUnique({
            where: {
                id,
            },
        });
        return playersData ? PlayerMapper.toDomain(playersData) : null;
    }

    async findByIdWithUser(id: string): Promise<PlayerWithUser | null> {
        const playerData = await this.client.player.findUnique({
            where: {
                id,
                status: PlayerStatus.ACTIVE,
            },
            include: {
                user: true,
            },
        });
        return playerData ? {
            player: PlayerMapper.toDomain(playerData),
            user: UserMapper.toDomain(playerData.user),
        } : null;
    }

    async findManyByIds(ids: string[]): Promise<Player[]> {
        const playersData = await this.client.player.findMany({
            where: {
                id: { in: ids },
                status: PlayerStatus.ACTIVE,
            },
        });
        return playersData.map(PlayerMapper.toDomain);
    }

    async findByUserIdAndSeason(userId: string, seasonStartYear: number): Promise<Player | null> {
        const playerData = await this.client.player.findUnique({
            where: {
                userId_seasonStartYear: {
                    userId,
                    seasonStartYear,
                },
                status: PlayerStatus.ACTIVE,
            },
        });
        return playerData ? PlayerMapper.toDomain(playerData) : null;
    }

    async findAllByUserId(userId: string): Promise<Player[]> {
        const playersData = await this.client.player.findMany({
            where: {
                userId,
                status: PlayerStatus.ACTIVE,
            }
        });
        return playersData.map(PlayerMapper.toDomain);
    }

    async findAllBySeasonWithUser(seasonStartYear: number): Promise<PlayerWithUser[]> {
        const playersData = await this.client.player.findMany({
            where: {
                seasonStartYear,
                status: PlayerStatus.ACTIVE,
            },
            include: {
                user: true,
            },
        });
        return playersData.map(data => ({
            player: PlayerMapper.toDomain(data),
            user: UserMapper.toDomain(data.user),
        }));
    }
}
