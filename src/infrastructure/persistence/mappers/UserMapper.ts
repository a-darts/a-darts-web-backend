import { User as PrismaUser } from '@prisma/client';
import { User } from '../../../domain/entities/User.js';

export class UserMapper {
    // De Entidad de Dominio a Objeto de Prisma (Persistencia)
    static toPersistence(user: User) {
        return {
            id: user.getId(),
            email: user.getEmail(),
            password: user.getPassword(),
            alias: user.getAlias(),
            role: user.getRole(),
            status: user.getStatus(),
            registratedAt: user.getRegistratedAt(),
            deletedAt: user.getDeletedAt(),
        };
    }

    // De Objeto de Prisma a Entidad de Dominio
    static toDomain(prismaUser: PrismaUser): User {
        return User.rehydrate({
            id: prismaUser.id,
            email: prismaUser.email,
            password: prismaUser.password,
            alias: prismaUser.alias,
            role: prismaUser.role,
            status: prismaUser.status,
            registratedAt: prismaUser.registratedAt,
            deletedAt: prismaUser.deletedAt,
        });
    }
}
