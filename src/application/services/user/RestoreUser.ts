import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { Mailer } from '../../../domain/services/Mailer.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';
import { RestoreUserRequestDTO } from '../../dtos/user/UserDTOs.js';

export class RestoreUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
  ) { }

  public async execute(request: RestoreUserRequestDTO): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(request.id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Create a temporary password and hash it
    const temporaryPlainPassword = 'temp_' + Math.random().toString(36).substring(2, 7);
    const hashedPassword = await this.passwordHasher.hash(temporaryPlainPassword);

    // 3. Restore the user
    user.restore(request.email, hashedPassword);

    // 4. Persist the changes in the DB
    await this.userRepository.update(user);

    // 5. Send the temporary password to the user (email)
    try {
      await this.mailer.sendTemporaryPassword(
        user.getEmail(),
        user.getAlias(),
        temporaryPlainPassword
      );
    } catch (mailerError) {
      console.error("Error while sending email with the temporary password to user:", mailerError);
      try {
        user.delete();
        await this.userRepository.update(user);
      } catch (deleteError) {
        console.error("Error while re-deleting user after email failure:", deleteError);
      }
      throw mailerError;
    }
  }
}
