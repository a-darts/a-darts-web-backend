import { Player } from '../entities/Player.js';
import { User } from '../entities/User.js';

export interface PlayerWithUser {
  player: Player;
  user: User;
}

export interface PlayerRepository {
  create(player: Player): Promise<void>;
  update(player: Player): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Player[]>;
  findById(id: string): Promise<Player | null>;
  findManyByIds(ids: string[]): Promise<Player[]>;
  findByUserIdAndSeason(userId: string, seasonStartYear: number): Promise<Player | null>;
  findAllByUserId(userId: string): Promise<Player[]>;
  findAllBySeasonWithUser(seasonStartYear: number): Promise<PlayerWithUser[]>;
}
