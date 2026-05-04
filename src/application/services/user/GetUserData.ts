import { UserRepository } from '../../../domain/repositories/UserRepository.js';

export interface GetUserDataResponse {
  id: string;
  email: string;
  alias: string;
  role: string;
  status: string;
  registratedAt: Date;
}

export class GetUserData {
  constructor(private readonly userRepository: UserRepository) { }

  public async execute(userId: string): Promise<GetUserDataResponse> {
    // 1. Rehydrate the user from the DB
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // CAMBIAR (DTO)
    // 2. Return the user data (without password)
    return {
      id: user.getId(),
      email: user.getEmail(),
      alias: user.getAlias(),
      role: user.getRole(),
      status: user.getStatus(),
      registratedAt: user.getRegistratedAt(),
    };
  }
}
