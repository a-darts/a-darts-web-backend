import { User, UserRole } from '../../../domain/entities/User.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';

export interface RegisterUserRequest {
  email: string;
  password: string;
  alias: string;
  role: UserRole;
}

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) { }

  public async execute(request: RegisterUserRequest): Promise<void> {
    // 1. Rehydrate the user from the DB
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 2. Hash the password
    const hashedPassword = await this.passwordHasher.hash(request.password);

    // 3. Create the user (with the factory method)
    const user = User.create(
      request.email,
      hashedPassword,
      request.alias,
      request.role
    );

    // 4. Persist the user in the DB
    await this.userRepository.create(user);
  }
}
