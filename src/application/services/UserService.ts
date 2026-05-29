import { User, UserStatus } from '../../domain/entities/User.js';
import {
    EmailAlreadyInUseException,
    InvalidCredentialsException,
    InvalidPasswordException,
    UserBlockedException,
    UserDeletedException,
    UserInactiveException,
    UserNotFoundException,
    UserNotInactiveException,
} from '../../domain/exceptions/UserExceptions.js';
import { IUserRepository } from '../../domain/repositories/IUserRepository.js';
import { Mailer } from '../../domain/services/Mailer.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import {
    ActivateAccountRequestDTO,
    CreateTemporaryPasswordRequestDTO,
    LoginUserRequestDTO,
    PaginatedUsersResponse,
    RegisterUserByAdminRequestDTO,
    RegisterUserRequestDTO,
    RestoreUserRequestDTO,
    UpdateUserAliasRequestDTO,
    UpdateUserEmailRequestDTO,
    UpdateUserPasswordRequestDTO,
    UserResponseDTO,
} from '../dtos/user/UserDTOs.js';
import { UserMapper } from '../dtos/user/UserMapper.js';



export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly mailer: Mailer,
    
  ) { }

    
  public async getById(id: string): Promise<UserResponseDTO> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Return the user data (without password)
    return UserMapper.toResponse(user);
  }
    
    
  public async getAll(page?: number, limit?: number): Promise<UserResponseDTO[] | PaginatedUsersResponse> {
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const take = limit;

      const [users, total] = await Promise.all([
        this.userRepository.findAll(skip, take),
        this.userRepository.count()
      ]);

      return {
        users: users.map(user => UserMapper.toResponse(user)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    // 1. Rehydrate the user from the DB
    const users = await this.userRepository.findAll();
    if (!users) {
      return [];
    }

    // 2. Return the user data (without password)
    return users.map(user => UserMapper.toResponse(user));
  }
    
    
  public async registerSelf(request: RegisterUserRequestDTO): Promise<UserResponseDTO> {
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
    

  public async registerByAdmin(request: RegisterUserByAdminRequestDTO): Promise<UserResponseDTO> {
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


  public async login(request: LoginUserRequestDTO): Promise<UserResponseDTO> {
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

    if (user.getStatus() === UserStatus.INACTIVE) {
    throw new UserInactiveException();
    }

    // 4. Return the user data
    return UserMapper.toResponse(user);
  }
   
    
  public async createTemporaryPassword(request: CreateTemporaryPasswordRequestDTO): Promise<void> {
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
    
    
  public async activateAccount(request: ActivateAccountRequestDTO): Promise<void> {
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


  public async block(id: string): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Block the user
    user.block();

    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }
    

  public async unblock(id: string): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Unblock the user
    user.unblock();

    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }
    

  public async delete(id: string): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundException();
    }
    
    // 2. Delete the user
    user.delete();
  
    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }
    

  public async restore(request: RestoreUserRequestDTO): Promise<void> {
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
  
    
  public async updateAlias(request: UpdateUserAliasRequestDTO): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(request.id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Update the alias in the user object
    user.updateAlias(request.newAlias);

    // 3. Persist the changes in the DB
    await this.userRepository.update(user);
  }


  public async updateEmail(request: UpdateUserEmailRequestDTO): Promise<void> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(request.id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 2. Check if the newEmail is the same as the current email
    if (user.getEmail() === request.newEmail) {
      return;
    }

    // 3. Check if the new email is already taken by someone else
    const existingUser = await this.userRepository.findByEmail(request.newEmail);
    if (existingUser) {
      throw new EmailAlreadyInUseException();
    }

    // 4. Update the email in the user object
    user.updateEmail(request.newEmail);

    // 5. Persist the changes in the DB
    await this.userRepository.update(user);
  }
    
    
  public async updatePassword(request: UpdateUserPasswordRequestDTO): Promise<void> {
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
