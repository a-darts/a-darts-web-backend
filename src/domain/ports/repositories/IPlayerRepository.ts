import { Player, PlayerStatus } from '../../entities/Player.js';
import { User } from '../../entities/User.js';

export interface PlayerWithUser {
  player: Player;
  user: User;
}

export interface IPlayerRepository {
  create(player: Player): Promise<void>;
  update(player: Player): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(skip?: number, take?: number, search?: string, status?: PlayerStatus, federation?: string, seasonStartYear?: number): Promise<Player[]>;
  findAllWithUser(skip?: number, take?: number, search?: string, status?: PlayerStatus, federation?: string, seasonStartYear?: number): Promise<PlayerWithUser[]>;
  findById(id: string): Promise<Player | null>;
  findByIdWithUser(id: string): Promise<PlayerWithUser | null>;
  findManyByIds(ids: string[]): Promise<Player[]>;
  findByUserIdAndSeason(userId: string, seasonStartYear: number): Promise<Player | null>;
  findAllByUserId(userId: string): Promise<Player[]>;
  findAllBySeasonWithUser(seasonStartYear: number): Promise<PlayerWithUser[]>;
  count(search?: string, status?: PlayerStatus, federation?: string, seasonStartYear?: number): Promise<number>;
}
