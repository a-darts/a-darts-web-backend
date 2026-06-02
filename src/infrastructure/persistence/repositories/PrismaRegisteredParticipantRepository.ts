import { PrismaClient } from '@prisma/client';
import { RegisteredParticipant } from '../../../domain/entities/Participant.js';
import { RegisteredParticipantMapper } from '../mappers/RegisteredParticipantMapper.js';
import { IRegisteredParticipantRepository } from '../../../domain/ports/repositories/IRegisteredParticipantRepository.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaRegisteredParticipantRepository implements IRegisteredParticipantRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private get client() {
        const tx = transactionStorage.getStore();
        if (tx) {
            return tx;
        }
        return this.prisma;
    }

    async create(registeredParticipant: RegisteredParticipant): Promise<void> {
        const data = RegisteredParticipantMapper.toPersistence(registeredParticipant);
        await this.client.registeredParticipant.create({ data });
    }

    async update(registeredParticipant: RegisteredParticipant): Promise<void> {
        const data = RegisteredParticipantMapper.toPersistence(registeredParticipant);
        await this.client.registeredParticipant.update({
            where: { id: registeredParticipant.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.registeredParticipant.delete({
            where: { id }
        });
    }

    async findAll(): Promise<RegisteredParticipant[]> {
        const registeredParticipantsData = await this.client.registeredParticipant.findMany({
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantsData.map(RegisteredParticipantMapper.toDomain);
    }

    async findById(id: string): Promise<RegisteredParticipant | null> {
        const registeredParticipantsData = await this.client.registeredParticipant.findUnique({
            where: { id },
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantsData ? RegisteredParticipantMapper.toDomain(registeredParticipantsData) : null;
    }

    async findByTournamentIdAndPlayerId(tournamentId: string, playerId: string): Promise<RegisteredParticipant | null> {
        const registeredParticipantData = await this.client.registeredParticipant.findUnique({
            where: {
                playerId_tournamentId: {
                    playerId: playerId,
                    tournamentId: tournamentId,
                },
            },
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantData ? RegisteredParticipantMapper.toDomain(registeredParticipantData) : null;
    }

    async findAllByTournamentId(tournamentId: string): Promise<RegisteredParticipant[]> {
        const registeredParticipantsData = await this.client.registeredParticipant.findMany({
            where: { tournamentId: tournamentId },
            include: { player: { include: { user: true } } },
            orderBy: {
                registeredAt: 'desc'
            },
        });
        return registeredParticipantsData.map(RegisteredParticipantMapper.toDomain);
    }

    async findAllByPlayerId(playerId: string): Promise<RegisteredParticipant[]> {
        const registeredParticipantsData = await this.client.registeredParticipant.findMany({
            where: { playerId: playerId },
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantsData.map(RegisteredParticipantMapper.toDomain);
    }

    async countByTournamentId(tournamentId: string): Promise<number> {
        return await this.client.registeredParticipant.count({
            where: { tournamentId: tournamentId },
        });
    }
}
