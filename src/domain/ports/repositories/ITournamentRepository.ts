import { Tournament } from '../../entities/Tournament.js';

export interface TournamentFilter {
  includeDeleted?: boolean;
}

export interface ITournamentRepository {
  create(tournament: Tournament): Promise<void>;
  update(tournament: Tournament): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(filter?: TournamentFilter): Promise<Tournament[]>;
  findById(id: string): Promise<Tournament | null>;
}
