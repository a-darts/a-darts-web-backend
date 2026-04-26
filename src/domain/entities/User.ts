export type UserRole = 'user' | 'admin' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface UserProps {
  id: string;
  email: string;
  password?: string;
  alias: string;
  role: UserRole;
  registratedAt: Date;
  status: UserStatus;
}

export class User {
  public readonly id: string;
  public email: string;
  public password?: string;
  public alias: string;
  public role: UserRole;
  public readonly registratedAt: Date;
  public status: UserStatus;

  constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.password = props.password;
    this.alias = props.alias;
    this.role = props.role;
    this.registratedAt = props.registratedAt;
    this.status = props.status;
  }

  public updateAlias(newAlias: string): void {
    if (!newAlias || newAlias.trim() === '') {
      throw new Error('Alias cannot be empty');
    }
    this.alias = newAlias;
  }

  public static create(props: Omit<UserProps, 'id' | 'registratedAt' | 'status'>): User {
    if (!props.email || !props.password) {
      throw new Error('Email and password are required');
    }

    return new User({
      ...props,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      registratedAt: new Date(),
      status: 'active'
    });
  }
}
