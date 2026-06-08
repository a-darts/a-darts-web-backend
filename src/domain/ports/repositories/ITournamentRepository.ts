import { Tournament, TournamentStatus } from '../../entities/Tournament.js';

export interface ITournamentRepository {
  create(tournament: Tournament): Promise<void>;
  update(tournament: Tournament): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(skip?: number, take?: number, statuses?: TournamentStatus[]): Promise<Tournament[]>;
  count(statuses?: TournamentStatus[]): Promise<number>
  findById(id: string): Promise<Tournament | null>;
}
