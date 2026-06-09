import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaRegisteredParticipantRepository } from '../../../../infrastructure/persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { PrismaPlayerRepository } from '../../../../infrastructure/persistence/repositories/PrismaPlayerRepository.js';
import { PrismaTournamentRepository } from '../../../../infrastructure/persistence/repositories/PrismaTournamentRepository.js';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { Player } from '../../../../domain/entities/Player.js';
import { Tournament } from '../../../../domain/entities/Tournament.js';
import { User, UserRoles } from '../../../../domain/entities/User.js';
import { Season } from '../../../../domain/entities/Season.js';
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from '../../../../domain/entities/TournamentInfo.js';

describe('RegisteredParticipantRepository Integration Tests', () => {
  let participantRepository: PrismaRegisteredParticipantRepository;
  let playerRepository: PrismaPlayerRepository;
  let tournamentRepository: PrismaTournamentRepository;
  let userRepository: PrismaUserRepository;

  let testUser: User;
  let testPlayer: Player;
  let testTournament: Tournament;

  beforeAll(async () => {
    await startIntegrationTestDB();
    participantRepository = new PrismaRegisteredParticipantRepository(prisma);
    playerRepository = new PrismaPlayerRepository(prisma);
    tournamentRepository = new PrismaTournamentRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await stopIntegrationTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Create base user
    testUser = User.createByAdmin('participant@test.com', 'pwd123', 'participantAlias', UserRoles.PLAYER);
    await userRepository.create(testUser);

    // Create base player
    testPlayer = Player.create(testUser.getId(), 'REG-P1', 'FED-A', new Season(2023));
    await playerRepository.create(testPlayer);

    // Create base tournament
    const info = new TournamentInfo('Madrid', new Date(), GameModes.SINGLE, '501', ScheduleTypes.KO, 32, GameTypes.BEST_OF, 5, 3, 'Standard', 'Info', 'FED-A');
    testTournament = Tournament.create('Test Tournament', new Season(2023), info, testUser.getId());
    await tournamentRepository.create(testTournament);
  });

  it('should successfully create and retrieve a participant by ID', async () => {
    const participant = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'participantAlias', 'FED-A');
    
    await participantRepository.create(participant);
    const retrieved = await participantRepository.findById(participant.getId());

    expect(retrieved).not.toBeNull();
    expect(retrieved?.getPlayerId()).toBe(testPlayer.getId());
    expect(retrieved?.getTournamentId()).toBe(testTournament.getId());
    expect(retrieved?.getAlias()).toBe('participantAlias');
    expect(retrieved?.getFederation()).toBe('FED-A');
    expect(retrieved?.hasDoneCheckIn()).toBe(false);
  });

  it('should return null for a non-existent participant ID', async () => {
    const retrieved = await participantRepository.findById('00000000-0000-0000-0000-000000000000');
    expect(retrieved).toBeNull();
  });

  it('should retrieve a participant by tournament and player ID', async () => {
    const participant = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias', 'FED-A');
    await participantRepository.create(participant);

    const retrieved = await participantRepository.findByTournamentIdAndPlayerId(testTournament.getId(), testPlayer.getId());
    expect(retrieved).not.toBeNull();
    expect(retrieved?.getId()).toBe(participant.getId());
  });

  it('should enforce unique constraints on playerId and tournamentId', async () => {
    const participant1 = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias', 'FED-A');
    const participant2 = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias2', 'FED-A');

    await participantRepository.create(participant1);
    
    // Attempting to register the same player twice in the same tournament
    await expect(participantRepository.create(participant2)).rejects.toThrow();
  });

  it('should retrieve all participants for a tournament', async () => {
    // Create a second player
    const user2 = User.createByAdmin('user2@test.com', 'pwd', 'alias2', UserRoles.PLAYER);
    await userRepository.create(user2);
    const player2 = Player.create(user2.getId(), 'REG-P2', 'FED-A', new Season(2023));
    await playerRepository.create(player2);

    const p1 = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias1', 'FED-A');
    const p2 = RegisteredParticipant.create(player2.getId(), testTournament.getId(), 'alias2', 'FED-A');

    await participantRepository.create(p1);
    await participantRepository.create(p2);

    const participants = await participantRepository.findAllByTournamentId(testTournament.getId());
    expect(participants).toHaveLength(2);
    const ids = participants.map(p => p.getId());
    expect(ids).toContain(p1.getId());
    expect(ids).toContain(p2.getId());
  });

  it('should count participants by tournament id', async () => {
    const p1 = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias', 'FED-A');
    await participantRepository.create(p1);

    const count = await participantRepository.countByTournamentId(testTournament.getId());
    expect(count).toBe(1);
  });

  it('should successfully update a participant (doCheckIn)', async () => {
    const participant = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias', 'FED-A');
    await participantRepository.create(participant);

    participant.doCheckIn();
    await participantRepository.update(participant);

    const retrieved = await participantRepository.findById(participant.getId());
    expect(retrieved?.hasDoneCheckIn()).toBe(true);
    expect(retrieved?.getCheckedInAt()).not.toBeNull();
  });

  it('should successfully delete a participant', async () => {
    const participant = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias', 'FED-A');
    await participantRepository.create(participant);

    await participantRepository.delete(participant.getId());

    const retrieved = await participantRepository.findById(participant.getId());
    expect(retrieved).toBeNull();
  });
});
