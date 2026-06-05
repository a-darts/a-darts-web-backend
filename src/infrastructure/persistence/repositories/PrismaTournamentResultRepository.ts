import { PrismaClient } from '@prisma/client';
import { TournamentResult } from '../../../domain/entities/TournamentResult.js';
import { ITournamentResultRepository, TournamentResultWithPlayerAndUser, TournamentResultWithTournament } from '../../../domain/ports/repositories/ITournamentResultRepository.js';
import { TournamentResultMapper } from '../mappers/TournamentResultMapper.js';
import { PlayerMapper } from '../mappers/PlayerMapper.js';
import { UserMapper } from '../mappers/UserMapper.js';
import { TournamentMapper } from '../mappers/TournamentMapper.js';

export class PrismaTournamentResultRepository implements ITournamentResultRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(result: TournamentResult): Promise<void> {
        await this.prisma.tournamentResult.create({
            data: TournamentResultMapper.toPersistence(result)
        });
    }

    async createMany(results: TournamentResult[]): Promise<void> {
        if (results.length === 0) return;
        await this.prisma.tournamentResult.createMany({
            data: results.map(r => TournamentResultMapper.toPersistence(r))
        });
    }

    async findAllByTournamentId(tournamentId: string): Promise<TournamentResult[]> {
        const results = await this.prisma.tournamentResult.findMany({
            where: { tournamentId },
        });
        return results.map(data => TournamentResultMapper.toDomain(data));
    }

    async findAllByTournamentIdWithPlayerAndUser(tournamentId: string): Promise<TournamentResultWithPlayerAndUser[]> {
        const results = await this.prisma.tournamentResult.findMany({
            where: { tournamentId },
            include: {
                player: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                finalPosition: 'asc'
            }
        });
        return results.map(data => ({
            result: TournamentResultMapper.toDomain(data),
            player: PlayerMapper.toDomain(data.player),
            user: UserMapper.toDomain(data.player?.user),
        }));
    }

    async findAllByPlayerId(playerId: string): Promise<TournamentResult[]> {
        const results = await this.prisma.tournamentResult.findMany({
            where: {
                playerId,
            },
        });

        return results.map(data => TournamentResultMapper.toDomain(data));
    }

    async findAllByPlayerIdsWithTournament(playerIds: string[]): Promise<TournamentResultWithTournament[]> {
        if (playerIds.length === 0) return [];

        const results = await this.prisma.tournamentResult.findMany({
            where: {
                playerId: {
                    in: playerIds
                }
            },
            include: {
                tournament: true
            },
            orderBy: {
                tournamentId: 'desc'
            }
        });

        return results.map(data => ({
            result: TournamentResultMapper.toDomain(data),
            tournament: TournamentMapper.toDomain(data.tournament),
        }));
    }
}
