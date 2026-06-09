import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaPlayingAreaRepository } from '../../../../infrastructure/persistence/repositories/PrismaPlayingAreaRepository.js';
import { PrismaTournamentRepository } from '../../../../infrastructure/persistence/repositories/PrismaTournamentRepository.js';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { PlayingArea } from '../../../../domain/entities/PlayingArea.js';
import { Tournament } from '../../../../domain/entities/Tournament.js';
import { User, UserRoles } from '../../../../domain/entities/User.js';
import { Season } from '../../../../domain/entities/Season.js';
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from '../../../../domain/entities/TournamentInfo.js';

describe('PlayingAreaRepository Integration Tests', () => {
  let playingAreaRepository: PrismaPlayingAreaRepository;
  let tournamentRepository: PrismaTournamentRepository;
  let userRepository: PrismaUserRepository;

  let testUser: User;
  let testTournament: Tournament;

  beforeAll(async () => {
    await startIntegrationTestDB();
    playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
    tournamentRepository = new PrismaTournamentRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await stopIntegrationTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Base User
    testUser = User.createByAdmin('area_user@test.com', 'pwd', 'areaAlias', UserRoles.ADMIN);
    await userRepository.create(testUser);

    // Base Tournament
    const info = new TournamentInfo('Madrid', new Date(), GameModes.SINGLE, '501', ScheduleTypes.KO, 32, GameTypes.BEST_OF, 5, 3, 'Standard', 'Info', 'FED-A');
    testTournament = Tournament.create('Area Tournament', new Season(2023), info, testUser.getId());
    await tournamentRepository.create(testTournament);
  });

  it('should successfully create and retrieve a playing area by ID', async () => {
    const numBoards = 4;
    const playingArea = PlayingArea.create(testTournament.getId(), numBoards);
    
    await playingAreaRepository.create(playingArea);
    const retrieved = await playingAreaRepository.findById(playingArea.getId());

    expect(retrieved).not.toBeNull();
    expect(retrieved?.getTournamentId()).toBe(testTournament.getId());
    expect(retrieved?.getShortId()).toBe(playingArea.getShortId());
    
    const boards = retrieved?.getBoards() || [];
    expect(boards).toHaveLength(numBoards);
    expect(boards[0].getNumber()).toBe(1);
    expect(boards[numBoards - 1].getNumber()).toBe(numBoards);
  });

  it('should return null for a non-existent playing area ID', async () => {
    const retrieved = await playingAreaRepository.findById('00000000-0000-0000-0000-000000000000');
    expect(retrieved).toBeNull();
  });

  it('should retrieve a playing area by tournament ID', async () => {
    const playingArea = PlayingArea.create(testTournament.getId(), 2);
    await playingAreaRepository.create(playingArea);

    const retrieved = await playingAreaRepository.findByTournamentId(testTournament.getId());
    expect(retrieved).not.toBeNull();
    expect(retrieved?.getId()).toBe(playingArea.getId());
  });

  it('should enforce unique constraint on tournamentId', async () => {
    const playingArea1 = PlayingArea.create(testTournament.getId(), 2);
    const playingArea2 = PlayingArea.create(testTournament.getId(), 3);

    await playingAreaRepository.create(playingArea1);
    
    // Cannot have two playing areas for the same tournament
    await expect(playingAreaRepository.create(playingArea2)).rejects.toThrow();
  });

  it('should successfully update playing area (add/remove boards)', async () => {
    const playingArea = PlayingArea.create(testTournament.getId(), 2);
    await playingAreaRepository.create(playingArea);

    playingArea.addBoard(); // Now has 3 boards
    await playingAreaRepository.update(playingArea);

    let retrieved = await playingAreaRepository.findById(playingArea.getId());
    expect(retrieved?.getBoards()).toHaveLength(3);

    retrieved!.removeLastBoard(); // Down to 2 boards again
    await playingAreaRepository.update(retrieved!);

    retrieved = await playingAreaRepository.findById(playingArea.getId());
    expect(retrieved?.getBoards()).toHaveLength(2);
  });

  it('should successfully update board status (disable/enable)', async () => {
    const playingArea = PlayingArea.create(testTournament.getId(), 1);
    await playingAreaRepository.create(playingArea);

    const board = playingArea.getBoards()[0];
    playingArea.disableBoard(board);
    await playingAreaRepository.update(playingArea);

    let retrieved = await playingAreaRepository.findById(playingArea.getId());
    expect(retrieved?.getBoards()[0].isAvailable()).toBe(false);

    retrieved!.enableBoard(retrieved!.getBoards()[0]);
    await playingAreaRepository.update(retrieved!);

    retrieved = await playingAreaRepository.findById(playingArea.getId());
    expect(retrieved?.getBoards()[0].isAvailable()).toBe(true);
  });

  it('should successfully delete a playing area', async () => {
    const playingArea = PlayingArea.create(testTournament.getId(), 2);
    await playingAreaRepository.create(playingArea);

    await playingAreaRepository.delete(playingArea.getId());

    const retrieved = await playingAreaRepository.findById(playingArea.getId());
    expect(retrieved).toBeNull();
  });
});
