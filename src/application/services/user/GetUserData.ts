import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { UserResponseDTO } from '../../dtos/user/UserDTOs.js';
import { UserMapper } from '../../dtos/user/UserMapper.js';

export class GetUserData {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(userId: string): Promise<UserResponseDTO> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Return the user data (without password)
    return UserMapper.toResponse(user);
  }
}
