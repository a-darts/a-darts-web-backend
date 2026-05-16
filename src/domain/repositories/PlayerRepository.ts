import { Player } from '../entities/Player.js';

export interface PlayerRepository {
  create(player: Player): Promise<void>;
  update(player: Player): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Player[]>;
  findById(id: string): Promise<Player | null>;
  findByUserId(id: string): Promise<Player | null>;
  findManyByIds(ids: string[]): Promise<Player[]>;
  // findByUserIdAndSeason(userId: string, seasonStartYear: number): Promise<Player | null>;
  findAllByUserId(userId: string): Promise<Player[]>;
}
