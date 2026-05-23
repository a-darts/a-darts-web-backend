import { Player } from "../entities/Player.js";
import { TournamentResult } from "../entities/TournamentResult.js";
import { User } from "../entities/User.js";

export interface TournamentResultWithPlayerAndUser {
    result: TournamentResult;
    player: Player;
    user: User;
}

export interface TournamentResultRepository {
    create(result: TournamentResult): Promise<void>;
    createMany(results: TournamentResult[]): Promise<void>;
    findAllByTournamentIdWithPlayerAndUser(tournamentId: string): Promise<TournamentResultWithPlayerAndUser[]>;
}
