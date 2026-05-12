import { User } from '../../../domain/entities/User.js';
import { UserResponseDTO } from './UserDTOs.js';

export class UserMapper {
    public static toResponse(user: User): UserResponseDTO {
        return {
            id: user.getId(),
            email: user.getEmail(),
            alias: user.getAlias(),
            role: user.getRole(),
            status: user.getStatus(),
            registeredAt: user.getRegisteredAt(),
        };
    }
}
