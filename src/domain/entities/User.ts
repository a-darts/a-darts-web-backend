import { InvalidUserFieldException, UserDeletedException, UserNotActiveException } from "../exceptions/UserExceptions.js";

export type UserRole = 'player' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'blocked' | 'deleted';


export class User {
  private readonly id: string;
  private email: string;
  private password?: string;
  private alias: string;
  private readonly role: UserRole;

  private readonly registratedAt: Date;
  private deletedAt?: Date | null;
  private status: UserStatus;

  constructor(
    id: string,
    email: string,
    password: string,
    alias: string,
    role: UserRole,
    registratedAt: Date,
    deletedAt: Date | null,
    status: UserStatus,
  ) {
    this.id = id;
    this.email = email;
    this.password = password;
    this.alias = alias;
    this.role = role;
    this.registratedAt = registratedAt;
    this.deletedAt = deletedAt;
    this.status = status;
  }


  // --------------------------------------------------------------------
  // FACTORY METHOD
  // --------------------------------------------------------------------
  public static create(
    email: string,
    password: string,
    alias: string,
    role: UserRole,
  ): User {
    if (!email || !password || !alias || !role) {
      throw new InvalidUserFieldException('Email, password, alias and role are required');
    }
    if (
      email.trim() === '' ||
      password.trim() === '' ||
      alias.trim() === ''
    ) {
      throw new InvalidUserFieldException('Email, password and alias cannot be empty');
    }

    return new User(
      crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      email,
      password,
      alias,
      role,
      new Date(),
      null,
      'inactive',
    );
  }


  // --------------------------------------------------------------------
  // UPDATE METHODS
  // --------------------------------------------------------------------
  public updateEmail(newEmail: string): void {
    if (this.status === 'deleted') {
      throw new UserDeletedException;
    }

    if (!newEmail || newEmail.trim() === '') {
      throw new InvalidUserFieldException('Email cannot be empty');
    }
    this.email = newEmail;
  }

  public updatePassword(newPassword: string): void {
    if (this.status === 'deleted') {
      throw new UserDeletedException;
    }

    if (!newPassword || newPassword.trim() === '') {
      throw new InvalidUserFieldException('Password cannot be empty');
    }

    this.password = newPassword;
  }

  public updateAlias(newAlias: string): void {
    if (this.status === 'deleted') {
      throw new UserDeletedException();
    }

    if (!newAlias || newAlias.trim() === '') {
      throw new InvalidUserFieldException('Alias cannot be empty');
    }
    this.alias = newAlias;
  }


  // --------------------------------------------------------------------
  // STATUS MANAGEMENT
  // --------------------------------------------------------------------
  public delete(): void {
    if (this.status === 'deleted') {
      throw new UserDeletedException();
    }
    this.status = 'deleted';
    this.deletedAt = new Date();

    // Anonymize sensitive data to comply with GDPR
    this.email = `deleted_${this.id}@scoreo.com`;
    this.password = undefined;
  }

  public activate(): void {
    if (this.status === 'deleted') {
      throw new UserDeletedException();
    }
    this.status = 'active';
  }

  public deactivate(): void {
    if (this.status !== 'active') {
      throw new UserNotActiveException();
    }
    this.status = 'inactive';
  }

  public block(): void {
    if (this.status === 'deleted') {
      throw new UserDeletedException();
    }
    this.status = 'blocked';
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

  public getRole(): UserRole {
    return this.role;
  }

  public getRegistratedAt(): Date {
    return this.registratedAt;
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
      data.password,
      data.alias,
      data.role,
      data.registratedAt,
      data.deletedAt,
      data.status,
    );
  }
}
