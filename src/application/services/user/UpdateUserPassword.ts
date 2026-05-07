import { InvalidPasswordException, UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';
import { UpdateUserPasswordRequestDto } from '../../dtos/user/UserDTOs.js';

export class UpdateUserPassword {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) { }

  public async execute(request: UpdateUserPasswordRequestDto): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(request.id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Verify the old password
    const currentHashedPassword = user.getPassword();
    if (!currentHashedPassword) {
      // This shouldn't happen ever (user always has password) -> INTERNAL DATA INCONSISTENCY
      console.error('[ERROR] User has no password');
      throw new Error('User has no password set');
    }

    const isPasswordCorrect = await this.passwordHasher.compare(
      request.oldPassword,
      currentHashedPassword
    );

    if (!isPasswordCorrect) {
      throw new InvalidPasswordException();
    }

    // 3. Hash the new password
    const hashedPassword = await this.passwordHasher.hash(request.newPassword);

    // 4. Update the password in the user object
    user.updatePassword(hashedPassword);

    // 5. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
