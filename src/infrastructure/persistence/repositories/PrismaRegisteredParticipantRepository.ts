import { PrismaClient } from '@prisma/client';
import { RegisteredParticipant } from '../../../domain/entities/Participant.js';
import { RegisteredParticipantMapper } from '../mappers/RegisteredParticipantMapper.js';
import { RegisteredParticipantRepository } from '../../../domain/repositories/RegisteredParticipantRepository.js';

export class PrismaRegisteredParticipantRepository implements RegisteredParticipantRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(registeredParticipant: RegisteredParticipant): Promise<void> {
        const data = RegisteredParticipantMapper.toPersistence(registeredParticipant);
        await this.prisma.registeredParticipant.create({ data });
    }

    async update(registeredParticipant: RegisteredParticipant): Promise<void> {
        const data = RegisteredParticipantMapper.toPersistence(registeredParticipant);
        await this.prisma.registeredParticipant.update({
            where: { id: registeredParticipant.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.registeredParticipant.delete({
            where: { id }
        });
    }

    async findAll(): Promise<RegisteredParticipant[]> {
        const registeredParticipantsData = await this.prisma.registeredParticipant.findMany({
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantsData.map(RegisteredParticipantMapper.toDomain);
    }

    async findById(id: string): Promise<RegisteredParticipant | null> {
        const registeredParticipantsData = await this.prisma.registeredParticipant.findUnique({
            where: { id },
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantsData ? RegisteredParticipantMapper.toDomain(registeredParticipantsData) : null;
    }

    async findByTournamentIdAndPlayerId(tournamentId: string, playerId: string): Promise<RegisteredParticipant | null> {
        const registeredParticipantData = await this.prisma.registeredParticipant.findUnique({
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
        const registeredParticipantsData = await this.prisma.registeredParticipant.findMany({
            where: { tournamentId: tournamentId },
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantsData.map(RegisteredParticipantMapper.toDomain);
    }

    async findAllByPlayerId(playerId: string): Promise<RegisteredParticipant[]> {
        const registeredParticipantsData = await this.prisma.registeredParticipant.findMany({
            where: { playerId: playerId },
            include: { player: { include: { user: true } } }
        });
        return registeredParticipantsData.map(RegisteredParticipantMapper.toDomain);
    }
}
