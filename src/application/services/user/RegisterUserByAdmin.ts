import { User } from '../../../domain/entities/User.js';
import { EmailAlreadyInUseException } from '../../../domain/exceptions/UserExceptions.js';
import { UnitOfWork } from '../../../domain/repositories/UnitOfWork.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { Mailer } from '../../../domain/services/Mailer.js';
import { PasswordHasher } from '../../../domain/services/PasswordHasher.js';
import { RegisterUserByAdminRequestDTO, UserResponseDTO } from '../../dtos/user/UserDTOs.js';
import { UserMapper } from '../../dtos/user/UserMapper.js';

export class RegisterUserByAdmin {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
  ) { }

  public async execute(request: RegisterUserByAdminRequestDTO): Promise<UserResponseDTO> {
    // 1. Rehydrate the user from the DB
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new EmailAlreadyInUseException();
    }

    // 2. Create a temporary password and hash it
    const temporaryPlainPassword = 'temp_' + Math.random().toString(36).substring(2, 7);
    const hashedPassword = await this.passwordHasher.hash(temporaryPlainPassword);

    // 3. Create the user (with the factory method)
    const user = User.createByAdmin(
      request.email,
      hashedPassword,
      request.alias,
      request.role
    );

    // 4. Persist the user in the DB
    await this.userRepository.create(user);

    // 5. Send the temporary password to the user (email)
    try {
      await this.mailer.sendTemporaryPassword(
        user.getEmail(),
        user.getAlias(),
        temporaryPlainPassword
      );
    } catch (mailerError) {
      console.error("Error while sending email with the temporary password to new user:", mailerError);
      try {
        await this.userRepository.delete(user.getId());
      } catch (deleteError) {
        console.error("Error while deleting user after email failure:", deleteError);
      }
      throw mailerError;
    }

    // 6. Return the user data
    return UserMapper.toResponse(user);
  }
}
