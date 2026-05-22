import { TournamentResult } from "../entities/TournamentResult.js";

export interface TournamentResultRepository {
    create(result: TournamentResult): Promise<void>;
    createMany(results: TournamentResult[]): Promise<void>;
    findByTournamentId(tournamentId: string): Promise<TournamentResult[]>;
}
