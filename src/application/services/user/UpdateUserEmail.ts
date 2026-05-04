import { UserRepository } from '../../../domain/repositories/UserRepository.js';

export class UpdateUserEmail {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(userId: string, newEmail: string): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Check if the newEmail is the same as the current email
    if (user.getEmail() === newEmail) {
      return;
    }

    // 3. Check if the new email is already taken by someone else
    const existingUser = await this.userRepository.findByEmail(newEmail);
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // 4. Update the email in the user object
    user.updateEmail(newEmail);

    // 5. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
