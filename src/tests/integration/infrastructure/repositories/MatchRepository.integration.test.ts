import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaMatchRepository } from '../../../../infrastructure/persistence/repositories/PrismaMatchRepository.js';
import { PrismaRegisteredParticipantRepository } from '../../../../infrastructure/persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { PrismaPlayerRepository } from '../../../../infrastructure/persistence/repositories/PrismaPlayerRepository.js';
import { PrismaTournamentRepository } from '../../../../infrastructure/persistence/repositories/PrismaTournamentRepository.js';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { PrismaPlayingAreaRepository } from '../../../../infrastructure/persistence/repositories/PrismaPlayingAreaRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { Match, MatchStatus } from '../../../../domain/entities/Match.js';
import { ParticipantTypes, RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { Player } from '../../../../domain/entities/Player.js';
import { Tournament } from '../../../../domain/entities/Tournament.js';
import { PlayingArea } from '../../../../domain/entities/PlayingArea.js';
import { User, UserRoles } from '../../../../domain/entities/User.js';
import { Season } from '../../../../domain/entities/Season.js';
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from '../../../../domain/entities/TournamentInfo.js';

describe('MatchRepository Integration Tests', () => {
  let matchRepository: PrismaMatchRepository;
  let participantRepository: PrismaRegisteredParticipantRepository;
  let playerRepository: PrismaPlayerRepository;
  let tournamentRepository: PrismaTournamentRepository;
  let userRepository: PrismaUserRepository;
  let playingAreaRepository: PrismaPlayingAreaRepository;

  let testUser1: User;
  let testUser2: User;
  let testTournament: Tournament;
  let testParticipant1: RegisteredParticipant;
  let testParticipant2: RegisteredParticipant;
  let testPlayingArea: PlayingArea;

  beforeAll(async () => {
    await startIntegrationTestDB();
    matchRepository = new PrismaMatchRepository(prisma);
    participantRepository = new PrismaRegisteredParticipantRepository(prisma);
    playerRepository = new PrismaPlayerRepository(prisma);
    tournamentRepository = new PrismaTournamentRepository(prisma);
    userRepository = new PrismaUserRepository(prisma);
    playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await stopIntegrationTestDB();
  });

  beforeEach(async () => {
    await clearDatabase();
    
    // Users
    testUser1 = User.createByAdmin('p1@test.com', 'pwd123', 'p1', UserRoles.PLAYER);
    testUser2 = User.createByAdmin('p2@test.com', 'pwd123', 'p2', UserRoles.PLAYER);
    await userRepository.create(testUser1);
    await userRepository.create(testUser2);

    // Players
    const testPlayer1 = Player.create(testUser1.getId(), 'REG-1', 'FED-A', new Season(2023));
    const testPlayer2 = Player.create(testUser2.getId(), 'REG-2', 'FED-A', new Season(2023));
    await playerRepository.create(testPlayer1);
    await playerRepository.create(testPlayer2);

    // Tournament
    const info = new TournamentInfo('Madrid', new Date(), GameModes.SINGLE, '501', ScheduleTypes.KO, 32, GameTypes.BEST_OF, 5, 3, 'Standard', 'Info', 'FED-A');
    testTournament = Tournament.create('Match Tournament', new Season(2023), info, testUser1.getId());
    await tournamentRepository.create(testTournament);

    // Participants
    testParticipant1 = RegisteredParticipant.create(testPlayer1.getId(), testTournament.getId(), 'p1', 'FED-A');
    testParticipant2 = RegisteredParticipant.create(testPlayer2.getId(), testTournament.getId(), 'p2', 'FED-A');
    await participantRepository.create(testParticipant1);
    await participantRepository.create(testParticipant2);

    // Playing Area
    testPlayingArea = PlayingArea.create(testTournament.getId(), 2);
    await playingAreaRepository.create(testPlayingArea);
  });

  it('should successfully create and retrieve a match', async () => {
    const match = Match.create(
        testTournament.getId(),
        testParticipant1.getId(),
        testParticipant2.getId(),
        ParticipantTypes.REGISTERED,
        ParticipantTypes.REGISTERED,
        1,
        1
    );
    
    await matchRepository.create(match);
    const retrieved = await matchRepository.findById(match.getId());

    expect(retrieved).not.toBeNull();
    expect(retrieved?.getTournamentId()).toBe(testTournament.getId());
    expect(retrieved?.getRound()).toBe(1);
    expect(retrieved?.getMatchIndex()).toBe(1);
    expect(retrieved?.getParticipant1Id()).toBe(testParticipant1.getId());
    expect(retrieved?.getParticipant2Id()).toBe(testParticipant2.getId());
    expect(retrieved?.getStatus()).toBe(MatchStatus.READY);
  });

  it('should retrieve a match with participants', async () => {
    const match = Match.create(
        testTournament.getId(),
        testParticipant1.getId(),
        testParticipant2.getId(),
        ParticipantTypes.REGISTERED,
        ParticipantTypes.REGISTERED,
        1,
        1
    );
    
    await matchRepository.create(match);
    
    const retrievedWithParts = await matchRepository.findByIdWithParticipants(match.getId());
    expect(retrievedWithParts).not.toBeNull();
    expect(retrievedWithParts?.match.getId()).toBe(match.getId());
    expect(retrievedWithParts?.participant1?.getId()).toBe(testParticipant1.getId());
    expect(retrievedWithParts?.participant2?.getId()).toBe(testParticipant2.getId());
  });

  it('should retrieve matches by tournament ID', async () => {
    const match = Match.create(
        testTournament.getId(),
        testParticipant1.getId(),
        testParticipant2.getId(),
        ParticipantTypes.REGISTERED,
        ParticipantTypes.REGISTERED,
        1,
        1
    );
    await matchRepository.create(match);

    const matches = await matchRepository.findManyByTournamentId(testTournament.getId());
    expect(matches).toHaveLength(1);
    expect(matches[0].getId()).toBe(match.getId());
  });

  it('should successfully update a match (start and set score)', async () => {
    const match = Match.create(
        testTournament.getId(),
        testParticipant1.getId(),
        testParticipant2.getId(),
        ParticipantTypes.REGISTERED,
        ParticipantTypes.REGISTERED,
        1,
        1
    );
    await matchRepository.create(match);

    match.start();
    match.addWinSet(testParticipant1.getId()); // P1 wins a set
    await matchRepository.update(match);

    const retrieved = await matchRepository.findById(match.getId());
    expect(retrieved?.getStatus()).toBe(MatchStatus.IN_PROGRESS);
    expect(retrieved?.getMatchScore().getParticipant1Score().getSetsWon()).toBe(1);
    expect(retrieved?.getMatchScore().getParticipant2Score().getSetsWon()).toBe(0);
  });

  it('should successfully delete a match', async () => {
    const match = Match.create(
        testTournament.getId(),
        testParticipant1.getId(),
        testParticipant2.getId(),
        ParticipantTypes.REGISTERED,
        ParticipantTypes.REGISTERED,
        1,
        1
    );
    await matchRepository.create(match);

    await matchRepository.delete(match.getId());

    const retrieved = await matchRepository.findById(match.getId());
    expect(retrieved).toBeNull();
  });
});
