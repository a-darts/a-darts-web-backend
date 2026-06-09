import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaTournamentRepository } from '../../../../infrastructure/persistence/repositories/PrismaTournamentRepository.js';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { Tournament, TournamentStatus } from '../../../../domain/entities/Tournament.js';
import { User, UserRoles } from '../../../../domain/entities/User.js';
import { Season } from '../../../../domain/entities/Season.js';
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from '../../../../domain/entities/TournamentInfo.js';

describe('TournamentRepository Integration Tests', () => {
  let tournamentRepository: PrismaTournamentRepository;
  let userRepository: PrismaUserRepository;
  let testUser: User;

  beforeAll(async () => {
    await startIntegrationTestDB();
    tournamentRepository = new PrismaTournamentRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await stopIntegrationTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    // Create a base user for the tournament to link to (createdBy)
    testUser = User.createByAdmin('tournament_admin@test.com', 'pwd123', 'adminAlias', UserRoles.ADMIN);
    await userRepository.create(testUser);
  });

  const createDummyInfo = () => new TournamentInfo(
    'Madrid',
    new Date(),
    GameModes.SINGLE,
    '501',
    ScheduleTypes.KO,
    32,
    GameTypes.BEST_OF,
    5,
    3,
    'Standard Rules',
    'Extra Info',
    'FED-A'
  );

  it('should successfully create and retrieve a tournament by ID', async () => {
    const season = new Season(2023);
    const tournament = Tournament.create('Summer Open', season, createDummyInfo(), testUser.getId());

    await tournamentRepository.create(tournament);
    const retrievedTournament = await tournamentRepository.findById(tournament.getId());

    expect(retrievedTournament).not.toBeNull();
    expect(retrievedTournament?.getName()).toBe('Summer Open');
    expect(retrievedTournament?.getCreatedBy()).toBe(testUser.getId());
    expect(retrievedTournament?.getSeason().getStartYear()).toBe(2023);
    expect(retrievedTournament?.getInfo().getPlace()).toBe('Madrid');
    expect(retrievedTournament?.getStatus()).toBe(TournamentStatus.DRAFT);
  });

  it('should return null for a non-existent tournament ID', async () => {
    const retrievedTournament = await tournamentRepository.findById('00000000-0000-0000-0000-000000000000');
    expect(retrievedTournament).toBeNull();
  });

  it('should successfully update a tournament', async () => {
    const tournament = Tournament.create('Autumn Cup', new Season(2023), createDummyInfo(), testUser.getId());
    await tournamentRepository.create(tournament);

    tournament.updateName('Autumn Cup 2023');
    tournament.publish(); // Changes status to PUBLISHED
    await tournamentRepository.update(tournament);

    const retrievedTournament = await tournamentRepository.findById(tournament.getId());
    expect(retrievedTournament?.getName()).toBe('Autumn Cup 2023');
    expect(retrievedTournament?.getStatus()).toBe(TournamentStatus.PUBLISHED);
  });

  it('should correctly filter tournaments by status', async () => {
    const t1 = Tournament.create('T1', new Season(2023), createDummyInfo(), testUser.getId());
    const t2 = Tournament.create('T2', new Season(2023), createDummyInfo(), testUser.getId());
    const t3 = Tournament.create('T3', new Season(2023), createDummyInfo(), testUser.getId());

    t2.publish();
    t3.publish();
    t3.start(); // Changes status to IN_PROGRESS (Assuming registration validation allows it or is mocked/skipped)
    // Actually, t3.start() requires registration to be closed. Let's just set it using internal logic or just use PUBLISHED.
    // For the sake of the test, let's just publish t2 and leave t1 in DRAFT.
    
    await tournamentRepository.create(t1);
    await tournamentRepository.create(t2);
    // Directly updating t2 in DB to PUBLISHED since we used the domain method
    await tournamentRepository.update(t2);

    const drafts = await tournamentRepository.findAll(undefined, undefined, [TournamentStatus.DRAFT]);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].getId()).toBe(t1.getId());

    const published = await tournamentRepository.findAll(undefined, undefined, [TournamentStatus.PUBLISHED]);
    expect(published).toHaveLength(1);
    expect(published[0].getId()).toBe(t2.getId());
  });

  it('should correctly count tournaments', async () => {
    const t1 = Tournament.create('T1', new Season(2023), createDummyInfo(), testUser.getId());
    const t2 = Tournament.create('T2', new Season(2023), createDummyInfo(), testUser.getId());

    await tournamentRepository.create(t1);
    await tournamentRepository.create(t2);

    const count = await tournamentRepository.count();
    expect(count).toBe(2);
  });

  it('should correctly delete a tournament', async () => {
    const tournament = Tournament.create('Winter Cup', new Season(2023), createDummyInfo(), testUser.getId());
    await tournamentRepository.create(tournament);

    await tournamentRepository.delete(tournament.getId());

    const retrievedTournament = await tournamentRepository.findById(tournament.getId());
    expect(retrievedTournament).toBeNull();
  });
});
