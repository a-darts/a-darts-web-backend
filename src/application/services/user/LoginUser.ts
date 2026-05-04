import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';

// CAMBIAR (DTO)
export interface LoginUserRequest {
  email: string;
  password: string;
}

// CAMBIAR (DTO)
export interface LoginUserResponse {
  id: string;
  email: string;
  alias: string;
  role: string;
}

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) { }

  public async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Compare the password
    const password = user.getPassword();
    if (!password) {
      throw new Error('User has no password');
    }

    const isPasswordValid = await this.passwordHasher.compare(request.password, password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 3. Check the status of the user (active or inactive)
    if (user.getStatus() === 'deleted') {
      throw new Error('User is deleted');
    }

    if (user.getStatus() === 'blocked') {
      throw new Error('User is blocked');
    }

    // CAMBIAR (DTO)
    // 3. Return the user data
    return {
      id: user.getId(),
      email: user.getEmail(),
      alias: user.getAlias(),
      role: user.getRole(),
    };
  }
}
