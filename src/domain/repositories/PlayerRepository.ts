import { Player } from '../entities/Player.js';

export interface PlayerRepository {
  create(player: Player): Promise<void>;
  update(player: Player): Promise<void>;
  delete(userId: string): Promise<void>;
  findAll(): Promise<Player[]>;
  findByUserId(userId: string): Promise<Player | null>;
}
