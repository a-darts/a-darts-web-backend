import { User, UserRoles, UserStatus } from '../../entities/User.js';

export interface IUserRepository {
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(skip?: number, take?: number, filters?: { search?: string; status?: UserStatus; role?: UserRoles }): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findManyByIds(ids: string[]): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  count(filters?: { search?: string; status?: UserStatus; role?: UserRoles }): Promise<number>;
}
