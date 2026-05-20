import { UserNotFoundException, InvalidCredentialsException, UserNotInactiveException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';
import { ActivateAccountRequestDTO } from '../../dtos/user/UserDTOs.js';
import { UserStatus } from '../../../domain/entities/User.js';

export class ActivateAccount {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) { }

  public async execute(request: ActivateAccountRequestDTO): Promise<void> {
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.getStatus() !== UserStatus.INACTIVE) {
      throw new UserNotInactiveException();
    }

    const currentPassword = user.getPassword();
    if (!currentPassword) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await this.passwordHasher.compare(request.temporaryPassword, currentPassword);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const newHashedPassword = await this.passwordHasher.hash(request.newPassword);
    user.updatePassword(newHashedPassword);
    user.activate();

    await this.userRepository.update(user);
  }
}
