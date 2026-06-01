import { Tournament } from '../../entities/Tournament.js';

export interface ITournamentRepository {
  create(tournament: Tournament): Promise<void>;
  update(tournament: Tournament): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Tournament[]>;
  findById(id: string): Promise<Tournament | null>;
}
