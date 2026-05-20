import { MissingRequiredUserFieldsException, UserAlreadyActiveException, UserAlreadyBlockedException, UserAlreadyDeletedException, UserDeletedException, UserNotActiveException, UserNotBlockedException, UserNotDeletedException, UserNotInactiveException } from "../exceptions/UserExceptions.js";

export enum UserRoles {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  DELETED = 'DELETED',
}

export class User {
  private readonly id: string;
  private email: string;
  private password?: string;
  private alias: string;
  private readonly role: UserRoles;

  private readonly registeredAt: Date;
  private deletedAt?: Date | null;
  private status: UserStatus;

  constructor(
    id: string,
    email: string,
    alias: string,
    role: UserRoles,
    registeredAt: Date,
    deletedAt: Date | null,
    status: UserStatus,
    password?: string,
  ) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.alias = alias;
    this.role = role;
    this.registeredAt = registeredAt;
    this.deletedAt = deletedAt;
    this.status = status;
  }


  // --------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------
  public static createByAdmin(
    email: string,
    temporaryPassword: string,
    alias: string,
    role: UserRoles,
  ): User {
    if (
      !email || !alias || !temporaryPassword || !role ||
      email.trim() === '' || temporaryPassword.trim() === '' || alias.trim() === ''
    ) {
      throw new MissingRequiredUserFieldsException();
    }

    return new User(
      crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      email,
      alias,
      role,
      new Date(),
      null,
      UserStatus.INACTIVE,
      temporaryPassword,
    );
  }

  public static createSelf(
    email: string,
    password: string,
    alias: string,
    role: UserRoles,
  ): User {
    if (
      !email || !password || !alias || !role ||
      email.trim() === '' || password.trim() === '' || alias.trim() === ''
    ) {
      throw new MissingRequiredUserFieldsException();
    }

    return new User(
      crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      email,
      alias,
      role,
      new Date(),
      null,
      UserStatus.ACTIVE,
      password,
    );
  }


  // --------------------------------------------------------------------
  // UPDATE METHODS
  // --------------------------------------------------------------------
  public updateEmail(newEmail: string): void {
    if (this.status === UserStatus.DELETED) {
      throw new UserDeletedException;
    }

    if (!newEmail || newEmail.trim() === '') {
      throw new MissingRequiredUserFieldsException();
    }
    this.email = newEmail;
  }

  public updatePassword(newPassword: string): void {
    if (this.status === UserStatus.DELETED) {
      throw new UserDeletedException;
    }

    if (!newPassword || newPassword.trim() === '') {
      throw new MissingRequiredUserFieldsException();
    }

    this.password = newPassword;
  }

  public updateAlias(newAlias: string): void {
    if (this.status === UserStatus.DELETED) {
      throw new UserDeletedException();
    }

    if (!newAlias || newAlias.trim() === '') {
      throw new MissingRequiredUserFieldsException();
    }
    this.alias = newAlias;
  }


  // --------------------------------------------------------------------
  // STATUS MANAGEMENT
  // --------------------------------------------------------------------
  public delete(): void {
    if (this.status === UserStatus.DELETED) {
      throw new UserAlreadyDeletedException();
    }
    this.status = UserStatus.DELETED;
    this.deletedAt = new Date();

    // Anonymize sensitive data to comply with GDPR
    this.email = `deleted_${this.id}@scoreo.com`;
    this.password = undefined;
  }

  public restore(cleanEmail: string, temporaryPassword: string): void {
    if (this.status !== UserStatus.DELETED) {
      throw new UserNotDeletedException();
    }
    if (!cleanEmail || cleanEmail.trim() === '') {
      throw new MissingRequiredUserFieldsException();
    }
    if (!temporaryPassword || temporaryPassword.trim() === '') {
      throw new MissingRequiredUserFieldsException();
    }

    this.status = UserStatus.INACTIVE;
    this.deletedAt = null;
    this.email = cleanEmail;
    this.password = temporaryPassword;
  }

  public activate(): void {
    if (this.status === UserStatus.ACTIVE) {
      throw new UserAlreadyActiveException();
    }
    if (this.status !== UserStatus.INACTIVE) {
      throw new UserNotInactiveException();
    }
    this.status = UserStatus.ACTIVE;
  }

  public deactivate(): void {
    if (this.status !== UserStatus.ACTIVE) {
      throw new UserNotActiveException();
    }
    this.status = UserStatus.INACTIVE;
  }

  public block(): void {
    if (this.status === UserStatus.BLOCKED) {
      throw new UserAlreadyBlockedException();
    }
    if (this.status !== UserStatus.ACTIVE) {
      throw new UserNotActiveException();
    }
    this.status = UserStatus.BLOCKED;
  }

  public unblock(): void {
    if (this.status !== UserStatus.BLOCKED) {
      throw new UserNotBlockedException();
    }
    this.status = UserStatus.ACTIVE;
  }


  // --------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------
  public getId(): string {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getPassword(): string | undefined {
    return this.password;
  }

  public getAlias(): string {
    return this.alias;
  }

  public getRole(): UserRoles {
    return this.role;
  }

  public getRegisteredAt(): Date {
    return this.registeredAt;
  }

  public getDeletedAt(): Date | null | undefined {
    return this.deletedAt;
  }

  public getStatus(): UserStatus {
    return this.status;
  }

  // --------------------------------------------------------------------
  // REHYDRATE METHOD
  // --------------------------------------------------------------------
  static rehydrate(data: any): User {
    return new User(
      data.id,
      data.email,
      data.alias,
      data.role,
      data.registeredAt,
      data.deletedAt,
      data.status,
      data.password,
    );
  }
}
