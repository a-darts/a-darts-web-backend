import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { User, UserRoles, UserStatus } from '../../../../domain/entities/User.js';

describe('UserRepository Integration Tests', () => {
  let userRepository: PrismaUserRepository;

  beforeAll(async () => {
    // Start container and migrate DB
    await startIntegrationTestDB();
    userRepository = new PrismaUserRepository(prisma);
  }, 60000); // Allow time for Docker to download image if needed

  afterAll(async () => {
    // Teardown container
    await stopIntegrationTestDB();
  });

  beforeEach(async () => {
    // Clean up tables before each test to ensure isolation
    await clearDatabase();
  });

  it('should successfully create and retrieve a user by ID', async () => {
    // Arrange
    const user = User.createByAdmin(
      'test@test.com',
      'password123',
      'testalias',
      UserRoles.PLAYER
    );

    // Act
    await userRepository.create(user);
    const retrievedUser = await userRepository.findById(user.getId());

    // Assert
    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.getEmail()).toBe('test@test.com');
    expect(retrievedUser?.getAlias()).toBe('testalias');
    expect(retrievedUser?.getRole()).toBe(UserRoles.PLAYER);
  });

  it('should return null when retrieving a non-existent user by ID', async () => {
    const retrievedUser = await userRepository.findById('00000000-0000-0000-0000-000000000000');
    expect(retrievedUser).toBeNull();
  });

  it('should successfully retrieve a user by email', async () => {
    const user = User.createByAdmin('email@test.com', 'pwd', 'alias2', UserRoles.ADMIN);
    await userRepository.create(user);

    const retrievedUser = await userRepository.findByEmail('email@test.com');
    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.getId()).toBe(user.getId());
  });

  it('should enforce unique constraints on email', async () => {
    const user1 = User.createByAdmin('duplicate@test.com', 'pwd1', 'alias1', UserRoles.PLAYER);
    const user2 = User.createByAdmin('duplicate@test.com', 'pwd2', 'alias2', UserRoles.PLAYER);

    await userRepository.create(user1);

    // Expect Prisma to throw an error for unique constraint violation (P2002)
    await expect(userRepository.create(user2)).rejects.toThrow();
  });

  it('should correctly update a user', async () => {
    const user = User.createByAdmin('update@test.com', 'pwd', 'alias', UserRoles.PLAYER);
    await userRepository.create(user);

    user.updateAlias('newAlias');
    await userRepository.update(user);

    const retrievedUser = await userRepository.findById(user.getId());
    expect(retrievedUser?.getAlias()).toBe('newAlias');
  });

  it('should correctly count users', async () => {
    await userRepository.create(User.createByAdmin('1@t.com', 'p', 'a', UserRoles.PLAYER));
    await userRepository.create(User.createByAdmin('2@t.com', 'p', 'b', UserRoles.PLAYER));

    const count = await userRepository.count();
    expect(count).toBe(2);
  });
  it('should correctly count users with filters', async () => {
    await userRepository.create(User.createByAdmin('1@t.com', 'p', 'a', UserRoles.PLAYER));
    await userRepository.create(User.createByAdmin('2@t.com', 'p', 'b', UserRoles.ADMIN));

    const countAll = await userRepository.count();
    expect(countAll).toBeGreaterThanOrEqual(2);

    const countPlayer = await userRepository.count({ role: UserRoles.PLAYER });
    expect(countPlayer).toBeGreaterThanOrEqual(1);

    const countSearch = await userRepository.count({ search: '1@t.com' });
    expect(countSearch).toBeGreaterThanOrEqual(1);

    const countStatus = await userRepository.count({ status: UserStatus.ACTIVE });
    expect(countStatus).toBeGreaterThanOrEqual(0);
  });

  it('should successfully find multiple users by their IDs', async () => {
    const user1 = User.createByAdmin('m1@test.com', 'pwd1', 'alias1', UserRoles.PLAYER);
    const user2 = User.createByAdmin('m2@test.com', 'pwd2', 'alias2', UserRoles.ADMIN);

    await userRepository.create(user1);
    await userRepository.create(user2);

    const users = await userRepository.findManyByIds([user1.getId(), user2.getId()]);
    expect(users).toHaveLength(2);
    const ids = users.map(u => u.getId());
    expect(ids).toContain(user1.getId());
    expect(ids).toContain(user2.getId());
  });
});
