import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaTournamentResultRepository } from '../../../../infrastructure/persistence/repositories/PrismaTournamentResultRepository.js';
import { PrismaRegisteredParticipantRepository } from '../../../../infrastructure/persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { PrismaPlayerRepository } from '../../../../infrastructure/persistence/repositories/PrismaPlayerRepository.js';
import { PrismaTournamentRepository } from '../../../../infrastructure/persistence/repositories/PrismaTournamentRepository.js';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { TournamentResult } from '../../../../domain/entities/TournamentResult.js';
import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { Player } from '../../../../domain/entities/Player.js';
import { Tournament } from '../../../../domain/entities/Tournament.js';
import { User, UserRoles } from '../../../../domain/entities/User.js';
import { Season } from '../../../../domain/entities/Season.js';
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from '../../../../domain/entities/TournamentInfo.js';

describe('TournamentResultRepository Integration Tests', () => {
  let resultRepository: PrismaTournamentResultRepository;
  let participantRepository: PrismaRegisteredParticipantRepository;
  let playerRepository: PrismaPlayerRepository;
  let tournamentRepository: PrismaTournamentRepository;
  let userRepository: PrismaUserRepository;

  let testUser: User;
  let testPlayer: Player;
  let testTournament: Tournament;
  let testParticipant: RegisteredParticipant;

  beforeAll(async () => {
    await startIntegrationTestDB();
    resultRepository = new PrismaTournamentResultRepository(prisma);
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
    
    testUser = User.createByAdmin('result@test.com', 'pwd123', 'alias', UserRoles.PLAYER);
    await userRepository.create(testUser);

    testPlayer = Player.create(testUser.getId(), 'REG-RES1', 'FED-A', new Season(2023));
    await playerRepository.create(testPlayer);

    const info = new TournamentInfo('Madrid', new Date(), GameModes.SINGLE, '501', ScheduleTypes.KO, 32, GameTypes.BEST_OF, 5, 3, 'Standard', 'Info', 'FED-A');
    testTournament = Tournament.create('Result Tournament', new Season(2023), info, testUser.getId());
    await tournamentRepository.create(testTournament);

    testParticipant = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias', 'FED-A');
    await participantRepository.create(testParticipant);
  });

  it('should successfully create and retrieve a tournament result', async () => {
    const result = TournamentResult.create(
        testTournament.getId(),
        testParticipant.getId(),
        testPlayer.getId(),
        1, // finalPosition
        5, // matchesWon
        0, // matchesLost
        10, // setsWon
        2,  // setsLost
        30, // legsWon
        10  // legsLost
    );
    
    await resultRepository.create(result);
    
    const retrievedAll = await resultRepository.findAllByTournamentId(testTournament.getId());
    expect(retrievedAll).toHaveLength(1);
    
    const retrieved = retrievedAll[0];
    expect(retrieved.getId()).toBe(result.getId());
    expect(retrieved.getTournamentId()).toBe(testTournament.getId());
    expect(retrieved.getParticipantId()).toBe(testParticipant.getId());
    expect(retrieved.getPlayerId()).toBe(testPlayer.getId());
    expect(retrieved.getFinalPosition()).toBe(1);
    expect(retrieved.getMatchesWon()).toBe(5);
  });

  it('should successfully create multiple results', async () => {
    // Create second player/participant
    const u2 = User.createByAdmin('u2@test.com', 'p', 'a2', UserRoles.PLAYER);
    await userRepository.create(u2);
    const p2 = Player.create(u2.getId(), 'REG-RES2', 'FED-A', new Season(2023));
    await playerRepository.create(p2);
    const part2 = RegisteredParticipant.create(p2.getId(), testTournament.getId(), 'a2', 'FED-A');
    await participantRepository.create(part2);

    const r1 = TournamentResult.create(testTournament.getId(), testParticipant.getId(), testPlayer.getId(), 1, 5, 0, 10, 2, 30, 10);
    const r2 = TournamentResult.create(testTournament.getId(), part2.getId(), p2.getId(), 2, 4, 1, 8, 4, 25, 15);

    await resultRepository.createMany([r1, r2]);

    const retrievedAll = await resultRepository.findAllByTournamentId(testTournament.getId());
    expect(retrievedAll).toHaveLength(2);
  });

  it('should successfully retrieve results with player and user included', async () => {
    const result = TournamentResult.create(testTournament.getId(), testParticipant.getId(), testPlayer.getId(), 1, 5, 0, 10, 2, 30, 10);
    await resultRepository.create(result);

    const resultsWithPlayer = await resultRepository.findAllByTournamentIdWithPlayerAndUser(testTournament.getId());
    expect(resultsWithPlayer).toHaveLength(1);
    expect(resultsWithPlayer[0].result.getId()).toBe(result.getId());
    expect(resultsWithPlayer[0].player.getId()).toBe(testPlayer.getId());
    expect(resultsWithPlayer[0].user.getId()).toBe(testUser.getId());
  });

  it('should successfully retrieve results by player ID', async () => {
    const result = TournamentResult.create(testTournament.getId(), testParticipant.getId(), testPlayer.getId(), 1, 5, 0, 10, 2, 30, 10);
    await resultRepository.create(result);

    const results = await resultRepository.findAllByPlayerId(testPlayer.getId());
    expect(results).toHaveLength(1);
    expect(results[0].getId()).toBe(result.getId());
  });

  it('should enforce unique constraint on tournamentId and participantId', async () => {
    const result1 = TournamentResult.create(testTournament.getId(), testParticipant.getId(), testPlayer.getId(), 1, 5, 0, 10, 2, 30, 10);
    const result2 = TournamentResult.create(testTournament.getId(), testParticipant.getId(), testPlayer.getId(), 2, 4, 1, 8, 4, 25, 15);

    await resultRepository.create(result1);
    
    // A participant can only have one result per tournament
    await expect(resultRepository.create(result2)).rejects.toThrow();
  });
});
