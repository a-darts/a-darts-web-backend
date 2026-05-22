import { PrismaClient } from '@prisma/client';
import { TournamentResultDTO } from '../../dtos/tournament/result/TournamentResultDTO.js';

export class GetTournamentResults {
    constructor(private readonly prisma: PrismaClient) { }

    public async execute(tournamentId: string): Promise<TournamentResultDTO[]> {
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

        return results.map((r: any) => ({
            id: r.id,
            tournamentId: r.tournamentId,
            participantId: r.participantId,
            playerId: r.playerId,
            alias: r.player.user.alias,
            federation: r.player.federation,
            finalPosition: r.finalPosition,
            matchesWon: r.matchesWon,
            matchesLost: r.matchesLost,
            setsWon: r.setsWon,
            setsLost: r.setsLost,
            legsWon: r.legsWon,
            legsLost: r.legsLost,
        }));
    }
}
