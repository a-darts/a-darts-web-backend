import { ForbiddenAccessException, UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { UpdateUserAliasRequestDto } from '../../dtos/user/UserDTOs.js';
import { UserAuthorization } from './utils/UserAuthorization.js';

export class UpdateUserAlias {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(request: UpdateUserAliasRequestDto): Promise<void> {
    // 1. AUTHORIZATION LOGIC (ADMIN or be the requester and the target)
    if (!UserAuthorization.isSelfOrAdmin(request.requestor, request.id)) {
      throw new ForbiddenAccessException('Users with PLAYER role can only update their own alias');
    }

    // 2. Rehydrate the user from the DB
    const user = await this.userRepository.findById(request.id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 3. Update the alias in the user object
    user.updateAlias(request.newAlias);

    // 4. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
