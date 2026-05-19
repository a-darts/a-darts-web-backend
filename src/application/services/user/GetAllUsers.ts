import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { UserResponseDTO } from '../../dtos/user/UserDTOs.js';
import { UserMapper } from '../../dtos/user/UserMapper.js';

export interface PaginatedUsersResponse {
  users: UserResponseDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class GetAllUsers {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(page?: number, limit?: number): Promise<UserResponseDTO[] | PaginatedUsersResponse> {
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const take = limit;

      const [users, total] = await Promise.all([
        this.userRepository.findAll(skip, take),
        this.userRepository.count()
      ]);

      return {
        users: users.map(user => UserMapper.toResponse(user)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    // 1. Rehydrate the user from the DB
    const users = await this.userRepository.findAll();
    if (!users) {
      return [];
    }

    // 2. Return the user data (without password)
    return users.map(user => UserMapper.toResponse(user));
  }
}
