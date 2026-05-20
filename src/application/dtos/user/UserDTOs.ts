import { UserRoles, UserStatus } from '../../../domain/entities/User.js';

export interface UserResponseDTO {
    id: string;
    email: string;
    alias: string;
    role: UserRoles;
    status: UserStatus;
    registeredAt: Date;
}

export interface RegisterUserRequestDTO {
    email: string;
    password: string;
    alias: string;
    role: UserRoles;
}

export interface RegisterUserByAdminRequestDTO {
    email: string;
    alias: string;
    role: UserRoles;
}

export interface LoginUserRequestDTO {
    email: string;
    password: string;
}

export interface UpdateUserAliasRequestDTO {
    id: string;
    newAlias: string;
}

export interface UpdateUserEmailRequestDTO {
    id: string;
    newEmail: string;
}

export interface UpdateUserPasswordRequestDTO {
    id: string;
    oldPassword: string;
    newPassword: string;
}

export interface RestoreUserRequestDTO {
    id: string;
    email: string;
}

export interface ActivateAccountRequestDTO {
    email: string;
    temporaryPassword: string;
    newPassword: string;
}
