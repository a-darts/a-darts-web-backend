import {
    User as PrismaUser,
    UserRoles as PrismaUserRoles,
    UserStatus as PrismaUserStatus,
} from '@prisma/client';
import { User, UserRoles, UserStatus } from '../../../domain/entities/User.js';

export class UserMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(user: User) {
        return {
            id: user.getId(),
            email: user.getEmail(),
            password: user.getPassword(),
            alias: user.getAlias(),
            role: user.getRole() as PrismaUserRoles,
            registeredAt: user.getRegisteredAt(),
            deletedAt: user.getDeletedAt(),
            status: user.getStatus() as PrismaUserStatus,
        };
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaUser: PrismaUser): User {
        return User.rehydrate({
            id: prismaUser.id,
            email: prismaUser.email,
            password: prismaUser.password,
            alias: prismaUser.alias,
            role: prismaUser.role as UserRoles,
            registeredAt: prismaUser.registeredAt,
            deletedAt: prismaUser.deletedAt,
            status: prismaUser.status as UserStatus,
        });
    }
}
