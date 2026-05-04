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
      throw new Error('User not found');
    }

    // 2. Hash the new password
    const hashedPassword = await this.passwordHasher.hash(request.newPassword);

    // 3. Update the password in the user object
    user.updatePassword(hashedPassword);

    // 4. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
