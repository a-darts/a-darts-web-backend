import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { UserResponseDTO } from '../../dtos/user/UserDTOs.js';
import { UserMapper } from '../../dtos/user/UserMapper.js';

export class GetAllUsers {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(): Promise<UserResponseDTO[]> {
    // 1. Rehydrate the user from the DB
    const users = await this.userRepository.findAll();
    if (!users) {
      return [];
    }

    // 2. Return the user data (without password)
    return users.map(user => UserMapper.toResponse(user));
  }
}
