import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';

export class DeleteUser {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Delete the user
    user.delete();

    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
