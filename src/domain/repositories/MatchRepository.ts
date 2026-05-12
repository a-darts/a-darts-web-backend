import { Match } from '../entities/Match.js';

export interface MatchRepository {
  create(match: Match): Promise<void>;
  update(match: Match): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Match[]>;
  findById(id: string): Promise<Match | null>;
  findManyByIds(ids: string[]): Promise<Match[]>;
}
