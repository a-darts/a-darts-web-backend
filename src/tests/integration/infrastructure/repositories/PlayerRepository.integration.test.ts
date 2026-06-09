import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaPlayerRepository } from '../../../../infrastructure/persistence/repositories/PrismaPlayerRepository.js';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { Player, PlayerStatus } from '../../../../domain/entities/Player.js';
import { User, UserRoles } from '../../../../domain/entities/User.js';
import { Season } from '../../../../domain/entities/Season.js';

describe('PlayerRepository Integration Tests', () => {
  let playerRepository: PrismaPlayerRepository;
  let userRepository: PrismaUserRepository;
  let testUser: User;

  beforeAll(async () => {
    await startIntegrationTestDB();
    playerRepository = new PrismaPlayerRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await stopIntegrationTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Create a base user for the player to link to
    testUser = User.createByAdmin('player_user@test.com', 'pwd123', 'playerAlias', UserRoles.PLAYER);
    await userRepository.create(testUser);
  });

  it('should successfully create and retrieve a player by ID', async () => {
    const season = new Season(2023);
    const player = Player.create(testUser.getId(), 'REG-123', 'FED-A', season);

    await playerRepository.create(player);
    const retrievedPlayer = await playerRepository.findById(player.getId());

    expect(retrievedPlayer).not.toBeNull();
    expect(retrievedPlayer?.getUserId()).toBe(testUser.getId());
    expect(retrievedPlayer?.getRegistrationNumber()).toBe('REG-123');
    expect(retrievedPlayer?.getFederation()).toBe('FED-A');
    expect(retrievedPlayer?.getSeason().getStartYear()).toBe(2023);
  });

  it('should return null for a non-existent player ID', async () => {
    const retrievedPlayer = await playerRepository.findById('00000000-0000-0000-0000-000000000000');
    expect(retrievedPlayer).toBeNull();
  });

  it('should retrieve a player by User ID and Season', async () => {
    const season = new Season(2024);
    const player = Player.create(testUser.getId(), 'REG-2024', 'FED-B', season);
    await playerRepository.create(player);

    const retrievedPlayer = await playerRepository.findByUserIdAndSeason(testUser.getId(), 2024);
    expect(retrievedPlayer).not.toBeNull();
    expect(retrievedPlayer?.getId()).toBe(player.getId());
  });

  it('should enforce unique constraints on userId and seasonStartYear', async () => {
    const season = new Season(2025);
    const player1 = Player.create(testUser.getId(), 'REG-1', 'FED-C', season);
    const player2 = Player.create(testUser.getId(), 'REG-2', 'FED-C', season);

    await playerRepository.create(player1);

    // Attempting to create a second player for the same user and season should fail
    await expect(playerRepository.create(player2)).rejects.toThrow();
  });

  it('should correctly update a player', async () => {
    const season = new Season(2023);
    const player = Player.create(testUser.getId(), 'REG-OLD', 'FED-OLD', season);
    await playerRepository.create(player);

    player.updateFederation('FED-NEW');
    await playerRepository.update(player);

    const retrievedPlayer = await playerRepository.findById(player.getId());
    expect(retrievedPlayer?.getFederation()).toBe('FED-NEW');
  });

  it('should softly delete a player by updating status', async () => {
    const season = new Season(2023);
    const player = Player.create(testUser.getId(), 'REG-DEL', 'FED-Z', season);
    await playerRepository.create(player);

    player.delete();
    await playerRepository.update(player);

    const retrievedPlayer = await playerRepository.findById(player.getId());
    expect(retrievedPlayer?.getStatus()).toBe(PlayerStatus.DELETED);
    expect(retrievedPlayer?.getDeletedAt()).not.toBeNull();
  });
});
