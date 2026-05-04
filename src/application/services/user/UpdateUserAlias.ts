import { UserRepository } from '../../../domain/repositories/UserRepository.js';

export class UpdateUserAlias {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(userId: string, newAlias: string): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Update the alias in the user object
    user.updateAlias(newAlias);

    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
