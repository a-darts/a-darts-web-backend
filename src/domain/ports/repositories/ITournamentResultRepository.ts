import { Player } from "../../entities/Player.js";
import { Tournament } from "../../entities/Tournament.js";
import { TournamentResult } from "../../entities/TournamentResult.js";
import { User } from "../../entities/User.js";

export interface TournamentResultWithPlayerAndUser {
    result: TournamentResult;
    player: Player;
    user: User;
}

export interface TournamentResultWithTournament {
    result: TournamentResult;
    tournament: Tournament;
}

export interface ITournamentResultRepository {
    create(result: TournamentResult): Promise<void>;
    createMany(results: TournamentResult[]): Promise<void>;
    findAllByTournamentId(tournamentId: string): Promise<TournamentResult[]>;
    findAllByTournamentIdWithPlayerAndUser(tournamentId: string): Promise<TournamentResultWithPlayerAndUser[]>;
    findAllByPlayerId(playerId: string): Promise<TournamentResult[]>;
    findAllByPlayerIdsWithTournament(playerIds: string[]): Promise<TournamentResultWithTournament[]>;
}
