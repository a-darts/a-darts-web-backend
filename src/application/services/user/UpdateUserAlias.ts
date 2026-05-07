import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { UpdateUserAliasRequestDto } from '../../dtos/user/UserDTOs.js';

export class UpdateUserAlias {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(request: UpdateUserAliasRequestDto): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(request.id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Update the alias in the user object
    user.updateAlias(request.newAlias);

    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
