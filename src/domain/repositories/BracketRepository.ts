import { Bracket } from '../entities/Bracket.js';

export interface BracketRepository {
  create(bracket: Bracket): Promise<void>;
  update(bracket: Bracket): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Bracket[]>;
  findById(id: string): Promise<Bracket | null>;
  findByTournamentId(tournamentId: string): Promise<Bracket | null>;
}
