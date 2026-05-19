import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';

export class UnblockUser {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Unblock the user
    user.unblock();

    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
