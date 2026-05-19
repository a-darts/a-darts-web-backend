import { UserStatus } from '../../../domain/entities/User.js';
import { InvalidCredentialsException, UserBlockedException, UserDeletedException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';
import { LoginUserRequestDTO, UserResponseDTO } from '../../dtos/user/UserDTOs.js';
import { UserMapper } from '../../dtos/user/UserMapper.js';

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) { }

  public async execute(request: LoginUserRequestDTO): Promise<UserResponseDTO> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    // 2. Compare the password
    const password = user.getPassword();
    if (!password) {
      // This shouldn't happen ever (user always has password) -> INTERNAL DATA INCONSISTENCY
      console.error('[ERROR] User has no password');
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await this.passwordHasher.compare(request.password, password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // 3. Check the status of the user (active or inactive)
    if (user.getStatus() === UserStatus.DELETED) {
      throw new UserDeletedException();
    }

    if (user.getStatus() === UserStatus.BLOCKED) {
      throw new UserBlockedException();
    }

    // 4. Return the user data
    return UserMapper.toResponse(user);
  }
}
