import { PrismaClient } from '@prisma/client';
import { Bracket } from '../../../domain/entities/Bracket.js';
import { BracketMapper } from '../mappers/BracketMapper.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';

export class PrismaBracketRepository implements BracketRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(bracket: Bracket): Promise<void> {
        const data = BracketMapper.toPersistence(bracket);
        await this.prisma.bracket.create({ data });
    }

    async update(bracket: Bracket): Promise<void> {
        const data = BracketMapper.toPersistence(bracket);
        await this.prisma.bracket.update({
            where: { id: bracket.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.bracket.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Bracket[]> {
        const bracketsData = await this.prisma.bracket.findMany({
            include: {
                positions: {
                    include: {
                        participant: {
                            include: {
                                player: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
        return bracketsData.map(BracketMapper.toDomain);
    }

    async findById(id: string): Promise<Bracket | null> {
        const bracketsData = await this.prisma.bracket.findUnique({
            where: { id },
            include: {
                positions: {
                    include: {
                        participant: {
                            include: {
                                player: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
        return bracketsData ? BracketMapper.toDomain(bracketsData) : null;
    }

    async findByTournamentId(tournamentId: string): Promise<Bracket | null> {
        const bracketsData = await this.prisma.bracket.findUnique({
            where: { tournamentId },
            include: {
                positions: {
                    include: {
                        participant: {
                            include: {
                                player: {
                                    include: {
                                        user: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
        return bracketsData ? BracketMapper.toDomain(bracketsData) : null;
    }
}
