import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../../application/services/UserService.js';
import { User, UserStatus } from '../../../domain/entities/User.js';
import { Role } from '../../../domain/entities/User.js';
import {
  EmailAlreadyInUseException,
  InvalidCredentialsException,
  InvalidPasswordException,
  UserBlockedException,
  UserDeletedException,
  UserInactiveException,
  UserNotFoundException,
  UserNotInactiveException,
} from '../../../domain/exceptions/UserExceptions.js';

vi.mock('../../../application/dtos/user/UserMapper.js', () => ({
  UserMapper: {
    toResponse: vi.fn((u) => ({ id: u.getId(), email: u.getEmail() })),
  },
}));

vi.mock('../../../domain/entities/User.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    User: {
      createSelf: vi.fn(),
      createByAdmin: vi.fn(),
    },
  };
});

describe('UserService', () => {
  let userService: UserService;
  let userRepositoryMock: any;
  let passwordHasherMock: any;
  let mailerMock: any;

  beforeEach(() => {
    userRepositoryMock = {
      findById: vi.fn(),
      findAll: vi.fn(),
      count: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    passwordHasherMock = {
      hash: vi.fn(),
      compare: vi.fn(),
    };
    mailerMock = {
      sendTemporaryPassword: vi.fn(),
      sendForgotPasswordRecovery: vi.fn(),
    };

    userService = new UserService(
      userRepositoryMock,
      passwordHasherMock,
      mailerMock
    );

    vi.clearAllMocks();
  });

  const createMockUser = (overrides = {}) => ({
    getId: vi.fn().mockReturnValue('user-id'),
    getEmail: vi.fn().mockReturnValue('test@test.com'),
    getPassword: vi.fn().mockReturnValue('hashed_password'),
    getAlias: vi.fn().mockReturnValue('alias'),
    getStatus: vi.fn().mockReturnValue(UserStatus.ACTIVE),
    updatePassword: vi.fn(),
    updateAlias: vi.fn(),
    updateEmail: vi.fn(),
    deactivate: vi.fn(),
    activate: vi.fn(),
    block: vi.fn(),
    unblock: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
    ...overrides,
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);

      const result = await userService.getById('user-id');

      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-id');
      expect(result.id).toBe('user-id');
    });

    it('should throw UserNotFoundException if not found', async () => {
      userRepositoryMock.findById.mockResolvedValue(null);
      await expect(userService.getById('user-id')).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('getAll', () => {
    it('should return all users without pagination', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findAll.mockResolvedValue([mockUser]);

      const result = await userService.getAll();

      expect(userRepositoryMock.findAll).toHaveBeenCalledWith();
      expect(result).toHaveLength(1);
    });

    it('should return paginated users', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findAll.mockResolvedValue([mockUser]);
      userRepositoryMock.count.mockResolvedValue(1);

      const result = await userService.getAll(1, 10);

      expect(userRepositoryMock.findAll).toHaveBeenCalledWith(0, 10);
      expect((result as any).users).toHaveLength(1);
      expect((result as any).pagination.total).toBe(1);
    });
  });

  describe('registerSelf', () => {
    it('should register a new user', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(null);
      passwordHasherMock.hash.mockResolvedValue('hashed');
      const mockUser = createMockUser();
      (User.createSelf as any).mockReturnValue(mockUser);

      const result = await userService.registerSelf({
        email: 'test@test.com',
        password: 'password',
        alias: 'alias'
      });

      expect(userRepositoryMock.findByEmail).toHaveBeenCalledWith('test@test.com');
      expect(passwordHasherMock.hash).toHaveBeenCalledWith('password');
      expect(User.createSelf).toHaveBeenCalledWith('test@test.com', 'hashed', 'alias');
      expect(userRepositoryMock.create).toHaveBeenCalledWith(mockUser);
      expect(result.id).toBe('user-id');
    });

    it('should throw EmailAlreadyInUseException if email exists', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(createMockUser());
      await expect(userService.registerSelf({ email: 'test@test.com', password: 'password', alias: 'alias' }))
        .rejects.toThrow(EmailAlreadyInUseException);
    });
  });

  describe('registerByAdmin', () => {
    it('should register user by admin and send email', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(null);
      passwordHasherMock.hash.mockResolvedValue('hashed');
      const mockUser = createMockUser();
      (User.createByAdmin as any).mockReturnValue(mockUser);

      const result = await userService.registerByAdmin({
        email: 'test@test.com',
        alias: 'alias',
        role: 'PLAYER' as any
      });

      expect(User.createByAdmin).toHaveBeenCalled();
      expect(userRepositoryMock.create).toHaveBeenCalledWith(mockUser);
      expect(mailerMock.sendTemporaryPassword).toHaveBeenCalled();
      expect(result.id).toBe('user-id');
    });

    it('should throw and delete user if mailer fails', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(null);
      passwordHasherMock.hash.mockResolvedValue('hashed');
      const mockUser = createMockUser();
      (User.createByAdmin as any).mockReturnValue(mockUser);
      mailerMock.sendTemporaryPassword.mockRejectedValue(new Error('Mail error'));

      await expect(userService.registerByAdmin({
        email: 'test@test.com',
        alias: 'alias',
        role: 'PLAYER' as any
      })).rejects.toThrow('Mail error');

      expect(userRepositoryMock.delete).toHaveBeenCalledWith('user-id');
    });
  });

  describe('login', () => {
    it('should login active user successfully', async () => {
      const mockUser = createMockUser({ getStatus: vi.fn().mockReturnValue(UserStatus.ACTIVE) });
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(true);

      const result = await userService.login({ email: 'test@test.com', password: 'password' });

      expect(passwordHasherMock.compare).toHaveBeenCalledWith('password', 'hashed_password');
      expect(result.id).toBe('user-id');
    });

    it('should throw InvalidCredentialsException for invalid password', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(false);

      await expect(userService.login({ email: 'test', password: 'bad' })).rejects.toThrow(InvalidCredentialsException);
    });

    it('should throw UserDeletedException if deleted', async () => {
      const mockUser = createMockUser({ getStatus: vi.fn().mockReturnValue(UserStatus.DELETED) });
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(true);

      await expect(userService.login({ email: 't', password: 'p' })).rejects.toThrow(UserDeletedException);
    });

    it('should throw UserBlockedException if blocked', async () => {
      const mockUser = createMockUser({ getStatus: vi.fn().mockReturnValue(UserStatus.BLOCKED) });
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(true);

      await expect(userService.login({ email: 't', password: 'p' })).rejects.toThrow(UserBlockedException);
    });

    it('should throw UserInactiveException if inactive', async () => {
      const mockUser = createMockUser({ getStatus: vi.fn().mockReturnValue(UserStatus.INACTIVE) });
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(true);

      await expect(userService.login({ email: 't', password: 'p' })).rejects.toThrow(UserInactiveException);
    });
  });

  describe('createTemporaryPassword', () => {
    it('should create temporary password, update user and send recovery email', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      passwordHasherMock.hash.mockResolvedValue('hashed_temp');

      await userService.createTemporaryPassword({ email: 'test@test.com' });

      expect(mockUser.updatePassword).toHaveBeenCalledWith('hashed_temp');
      expect(mockUser.deactivate).toHaveBeenCalled();
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
      expect(mailerMock.sendForgotPasswordRecovery).toHaveBeenCalled();
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      userRepositoryMock.findByEmail.mockResolvedValue(null);
      await expect(userService.createTemporaryPassword({ email: 't' })).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('activateAccount', () => {
    it('should activate account with valid temporary password', async () => {
      const mockUser = createMockUser({ getStatus: vi.fn().mockReturnValue(UserStatus.INACTIVE) });
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(true);
      passwordHasherMock.hash.mockResolvedValue('new_hashed');

      await userService.activateAccount({ email: 'test@test.com', temporaryPassword: 'temp', newPassword: 'new' });

      expect(passwordHasherMock.compare).toHaveBeenCalledWith('temp', 'hashed_password');
      expect(mockUser.updatePassword).toHaveBeenCalledWith('new_hashed');
      expect(mockUser.activate).toHaveBeenCalled();
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
    });

    it('should throw UserNotInactiveException if user is not inactive', async () => {
      const mockUser = createMockUser({ getStatus: vi.fn().mockReturnValue(UserStatus.ACTIVE) });
      userRepositoryMock.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.activateAccount({ email: 't', temporaryPassword: 't', newPassword: 'n' })).rejects.toThrow(UserNotInactiveException);
    });
  });

  describe('block / unblock', () => {
    it('should block user', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);

      await userService.block('id');

      expect(mockUser.block).toHaveBeenCalled();
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
    });

    it('should unblock user', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);

      await userService.unblock('id');

      expect(mockUser.unblock).toHaveBeenCalled();
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('delete / restore', () => {
    it('should delete user', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);

      await userService.delete('id');

      expect(mockUser.delete).toHaveBeenCalled();
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
    });

    it('should restore user and send email', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      passwordHasherMock.hash.mockResolvedValue('hashed');

      await userService.restore({ id: 'id', email: 'e' });

      expect(mockUser.restore).toHaveBeenCalledWith('e', 'hashed');
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
      expect(mailerMock.sendTemporaryPassword).toHaveBeenCalled();
    });
  });

  describe('updates', () => {
    it('should update alias', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);

      await userService.updateAlias({ id: 'id', newAlias: 'new' });

      expect(mockUser.updateAlias).toHaveBeenCalledWith('new');
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
    });

    it('should update email if not in use', async () => {
      const mockUser = createMockUser({ getEmail: vi.fn().mockReturnValue('old@test.com') });
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      userRepositoryMock.findByEmail.mockResolvedValue(null);

      await userService.updateEmail({ id: 'id', newEmail: 'new@test.com' });

      expect(mockUser.updateEmail).toHaveBeenCalledWith('new@test.com');
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
    });

    it('should throw if new email is in use', async () => {
      const mockUser = createMockUser({ getEmail: vi.fn().mockReturnValue('old@test.com') });
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      userRepositoryMock.findByEmail.mockResolvedValue(createMockUser());

      await expect(userService.updateEmail({ id: 'id', newEmail: 'new@test.com' })).rejects.toThrow(EmailAlreadyInUseException);
    });

    it('should update password with correct old password', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(true);
      passwordHasherMock.hash.mockResolvedValue('new_hashed');

      await userService.updatePassword({ id: 'id', oldPassword: 'old', newPassword: 'new' });

      expect(passwordHasherMock.compare).toHaveBeenCalledWith('old', 'hashed_password');
      expect(mockUser.updatePassword).toHaveBeenCalledWith('new_hashed');
      expect(userRepositoryMock.update).toHaveBeenCalledWith(mockUser);
    });

    it('should throw if old password is wrong', async () => {
      const mockUser = createMockUser();
      userRepositoryMock.findById.mockResolvedValue(mockUser);
      passwordHasherMock.compare.mockResolvedValue(false);

      await expect(userService.updatePassword({ id: 'id', oldPassword: 'old', newPassword: 'new' })).rejects.toThrow(InvalidPasswordException);
    });
  });
});
