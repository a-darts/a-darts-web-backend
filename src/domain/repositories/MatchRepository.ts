import { Match } from '../entities/Match.js';
import { RegisteredParticipant } from '../entities/Participant.js';

export interface MatchWithParticipants {
  match: Match;
  participant1: RegisteredParticipant | null;
  participant2: RegisteredParticipant | null;
}

export interface MatchRepository {
  create(match: Match): Promise<void>;
  update(match: Match): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Match[]>;
  findById(id: string): Promise<Match | null>;
  findByIdWithParticipants(id: string): Promise<MatchWithParticipants | null>;
  findManyByIds(ids: string[]): Promise<Match[]>;
  findByParticipantsIdsAndTournamentId(participant1Id: string, participant2Id: string, tournamentId: string): Promise<Match | null>;
  findManyByTournamentId(tournamentId: string): Promise<Match[]>;
  findManyByTournamentIdWithParticipants(tournamentId: string): Promise<MatchWithParticipants[]>;
}
