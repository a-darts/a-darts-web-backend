import { PrismaClient } from '@prisma/client';
import { Bracket } from '../../../domain/entities/Bracket.js';
import { BracketMapper } from '../mappers/BracketMapper.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaBracketRepository implements BracketRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private get client() {
        const tx = transactionStorage.getStore();
        if (tx) {
            return tx;
        }
        return this.prisma;
    }

    async create(bracket: Bracket): Promise<void> {
        const data = BracketMapper.toPersistence(bracket);
        await this.client.bracket.create({ data });
    }

    async update(bracket: Bracket): Promise<void> {
        const data = BracketMapper.toPersistence(bracket);
        await this.client.bracket.update({
            where: { id: bracket.getId() },
            data: {
                ...data,
                positions: {
                    deleteMany: {},
                    create: data.positions.create
                }
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.bracket.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Bracket[]> {
        const bracketsData = await this.client.bracket.findMany({
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
        const bracketsData = await this.client.bracket.findUnique({
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
        const bracketData = await this.client.bracket.findUnique({
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
        return bracketData ? BracketMapper.toDomain(bracketData) : null;
    }
}
