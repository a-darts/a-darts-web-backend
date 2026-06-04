import { Tournament } from '../../entities/Tournament.js';

export interface ITournamentRepository {
  create(tournament: Tournament): Promise<void>;
  update(tournament: Tournament): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(includeDeleted?: boolean): Promise<Tournament[]>;
  findById(id: string, includeDeleted?: boolean): Promise<Tournament | null>;
}
