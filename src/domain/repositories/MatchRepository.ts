import { Match } from '../entities/Match.js';

export interface MatchRepository {
  create(tournamentId: string, match: Match): Promise<void>;
  update(tournamentId: string, match: Match): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Match[]>;
  findById(id: string): Promise<Match | null>;
  findManyByIds(ids: string[]): Promise<Match[]>;
  findByParticipantsIdsAndTournamentId(participant1Id: string, participant2Id: string, tournamentId: string): Promise<Match | null>;
}
