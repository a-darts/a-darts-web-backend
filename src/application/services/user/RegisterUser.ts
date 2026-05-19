import { User } from '../../../domain/entities/User.js';
import { EmailAlreadyInUseException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';
import { RegisterUserRequestDTO, UserResponseDTO } from '../../dtos/user/UserDTOs.js';
import { UserMapper } from '../../dtos/user/UserMapper.js';

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) { }

  public async execute(request: RegisterUserRequestDTO): Promise<UserResponseDTO> {
    // 1. Rehydrate the user from the DB
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new EmailAlreadyInUseException();
    }

    // 2. Hash the password
    const hashedPassword = await this.passwordHasher.hash(request.password);

    // 3. Create the user (with the factory method)
    const user = User.createSelf(
      request.email,
      hashedPassword,
      request.alias,
      request.role
    );

    // 4. Persist the user in the DB
    await this.userRepository.create(user);

    // 5. Return the user data
    return UserMapper.toResponse(user);
  }
}
