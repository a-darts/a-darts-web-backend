import { UserRoles } from "../../../../domain/entities/User.js";

interface Requestor {
    id: string;
    role: UserRoles;
}

export class UserAuthorization {
    /**
     * Verifica si el solicitante es el mismo usuario del recurso o un administrador.
     */
    public static isSelfOrAdmin(requestor: Requestor, targetId: string): boolean {
        const isSelf = requestor.id === targetId;
        const isAdmin = requestor.role === UserRoles.ADMIN;

        return isSelf || isAdmin;
    }

    /**
     * Verifica si el solicitante es administrador.
     */
    public static isAdmin(requestor: Requestor): boolean {
        return requestor.role === UserRoles.ADMIN;
    }
}
