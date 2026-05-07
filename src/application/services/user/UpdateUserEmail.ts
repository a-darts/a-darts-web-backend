import { EmailAlreadyInUseException, ForbiddenAccessException, UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';
import { UpdateUserEmailRequestDto } from '../../dtos/user/UserDTOs.js';
import { UserAuthorization } from './utils/UserAuthorization.js';

export class UpdateUserEmail {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(request: UpdateUserEmailRequestDto): Promise<void> {
    // 1. AUTHORIZATION LOGIC (ADMIN or be the requester and the target)
    if (!UserAuthorization.isSelfOrAdmin(request.requestor, request.id)) {
      throw new ForbiddenAccessException('Users with PLAYER role can only update their own email');
    }

    // 2. Rehydrate the user from the DB
    const user = await this.userRepository.findById(request.id);
    if (!user) {
      throw new UserNotFoundException();
    }

    // 3. Check if the newEmail is the same as the current email
    if (user.getEmail() === request.newEmail) {
      return;
    }

    // 4. Check if the new email is already taken by someone else
    const existingUser = await this.userRepository.findByEmail(request.newEmail);
    if (existingUser) {
      throw new EmailAlreadyInUseException();
    }

    // 5. Update the email in the user object
    user.updateEmail(request.newEmail);

    // 6. Persist the changes in the DB
    await this.userRepository.update(user);
  }
}
