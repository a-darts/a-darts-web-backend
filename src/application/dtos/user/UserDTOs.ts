import { UserRoles, UserStatus } from '../../../domain/entities/User.js';

export interface UserResponseDto {
    id: string;
    email: string;
    alias: string;
    role: UserRoles;
    status: UserStatus;
    registeredAt: Date;
}

export interface RegisterUserRequestDto {
    email: string;
    password: string;
    alias: string;
    role: UserRoles;
}

export interface LoginUserRequestDto {
    email: string;
    password: string;
}

export interface UpdateUserAliasRequestDto {
    id: string;
    newAlias: string;
    requestor: {
        id: string;
        role: UserRoles;
    };
}

export interface UpdateUserEmailRequestDto {
    id: string;
    newEmail: string;
    requestor: {
        id: string;
        role: UserRoles;
    };
}

export interface UpdateUserPasswordRequestDto {
    id: string;
    oldPassword: string;
    newPassword: string;
    requestor: {
        id: string;
        role: UserRoles;
    };
}
