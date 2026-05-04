import { User } from '../../../domain/entities/User.js';
import { UserResponseDto } from './UserDTOs.js';

export class UserMapper {
    public static toResponse(user: User): UserResponseDto {
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
