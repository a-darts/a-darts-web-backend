import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { Mailer } from '../../../domain/services/Mailer.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';
import { CreateTemporaryPasswordRequestDTO } from '../../dtos/user/UserDTOs.js';

export class CreateTemporaryPassword {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
  ) { }

  public async execute(request: CreateTemporaryPasswordRequestDTO): Promise<void> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Create a temporary password and hash it
    const temporaryPlainPassword = 'temp_' + Math.random().toString(36).substring(2, 7);
    const hashedPassword = await this.passwordHasher.hash(temporaryPlainPassword);

    // 3. Update password and deactivate user
    user.updatePassword(hashedPassword);
    user.deactivate();

    // 4. Persist the changes in the DB
    await this.userRepository.update(user);

    // 5. Send the temporary password to the user (email)
    try {
      await this.mailer.sendForgotPasswordRecovery(
        user.getEmail(),
        user.getAlias(),
        temporaryPlainPassword
      );
    } catch (mailerError) {
      console.error("Error while sending email with the temporary password to user:", mailerError);
      throw mailerError;
    }
  }
}
