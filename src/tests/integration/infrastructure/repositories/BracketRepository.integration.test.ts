import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaBracketRepository } from '../../../../infrastructure/persistence/repositories/PrismaBracketRepository.js';
import { PrismaRegisteredParticipantRepository } from '../../../../infrastructure/persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { PrismaPlayerRepository } from '../../../../infrastructure/persistence/repositories/PrismaPlayerRepository.js';
import { PrismaTournamentRepository } from '../../../../infrastructure/persistence/repositories/PrismaTournamentRepository.js';
import { PrismaUserRepository } from '../../../../infrastructure/persistence/repositories/PrismaUserRepository.js';
import { startIntegrationTestDB, stopIntegrationTestDB, clearDatabase, prisma } from '../../setup.js';
import { Bracket, BracketPosition, BracketStatus } from '../../../../domain/entities/Bracket.js';
import { RegisteredParticipant, EmptyParticipant, ByeParticipant } from '../../../../domain/entities/Participant.js';
import { Player } from '../../../../domain/entities/Player.js';
import { Tournament } from '../../../../domain/entities/Tournament.js';
import { User, UserRoles } from '../../../../domain/entities/User.js';
import { Season } from '../../../../domain/entities/Season.js';
import { TournamentInfo, GameModes, ScheduleTypes, GameTypes } from '../../../../domain/entities/TournamentInfo.js';

describe('BracketRepository Integration Tests', () => {
  let bracketRepository: PrismaBracketRepository;
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
    bracketRepository = new PrismaBracketRepository(prisma);
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
    
    // Base User
    testUser = User.createByAdmin('bracket_user@test.com', 'pwd123', 'alias', UserRoles.PLAYER);
    await userRepository.create(testUser);

    // Base Player
    testPlayer = Player.create(testUser.getId(), 'REG-B1', 'FED-A', new Season(2023));
    await playerRepository.create(testPlayer);

    // Base Tournament
    const info = new TournamentInfo('Madrid', new Date(), GameModes.SINGLE, '501', ScheduleTypes.KO, 32, GameTypes.BEST_OF, 5, 3, 'Standard', 'Info', 'FED-A');
    testTournament = Tournament.create('Bracket Tournament', new Season(2023), info, testUser.getId());
    await tournamentRepository.create(testTournament);

    // Base Participant
    testParticipant = RegisteredParticipant.create(testPlayer.getId(), testTournament.getId(), 'alias', 'FED-A');
    await participantRepository.create(testParticipant);
  });

  it('should successfully create and retrieve a bracket with positions', async () => {
    // We will create a bracket with a RegisteredParticipant, an EmptyParticipant, and a ByeParticipant
    const positions = [
        BracketPosition.create(testParticipant, 1),
        BracketPosition.create(EmptyParticipant.create(), 2),
        BracketPosition.create(ByeParticipant.create(), 3)
    ];

    const bracket = new Bracket(
        crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
        BracketStatus.DRAFT,
        positions,
        testTournament.getId()
    );
    
    await bracketRepository.create(bracket);
    const retrieved = await bracketRepository.findById(bracket.getId());

    expect(retrieved).not.toBeNull();
    expect(retrieved?.getTournamentId()).toBe(testTournament.getId());
    expect(retrieved?.getStatus()).toBe(BracketStatus.DRAFT);
    
    const retrievedPositions = retrieved?.getPositions() || [];
    expect(retrievedPositions).toHaveLength(3);
    
    // Position 1 should be the RegisteredParticipant
    const p1 = retrievedPositions.find(p => p.getPosition() === 1);
    expect(p1?.getParticipant() instanceof RegisteredParticipant).toBe(true);
    expect(p1?.getParticipant().getId()).toBe(testParticipant.getId());

    // Position 2 should be Empty
    const p2 = retrievedPositions.find(p => p.getPosition() === 2);
    expect(p2?.getParticipant() instanceof EmptyParticipant).toBe(true);

    // Position 3 should be Bye
    const p3 = retrievedPositions.find(p => p.getPosition() === 3);
    expect(p3?.getParticipant() instanceof ByeParticipant).toBe(true);
  });

  it('should retrieve a bracket by tournament ID', async () => {
    const bracket = new Bracket(crypto.randomUUID(), BracketStatus.DRAFT, [], testTournament.getId());
    await bracketRepository.create(bracket);

    const retrieved = await bracketRepository.findByTournamentId(testTournament.getId());
    expect(retrieved).not.toBeNull();
    expect(retrieved?.getId()).toBe(bracket.getId());
  });

  it('should enforce unique constraint on tournamentId', async () => {
    const bracket1 = new Bracket(crypto.randomUUID(), BracketStatus.DRAFT, [], testTournament.getId());
    const bracket2 = new Bracket(crypto.randomUUID(), BracketStatus.DRAFT, [], testTournament.getId());

    await bracketRepository.create(bracket1);
    
    // Cannot have two brackets for the same tournament
    await expect(bracketRepository.create(bracket2)).rejects.toThrow();
  });

  it('should successfully update bracket status and positions', async () => {
    const initialPositions = [
        BracketPosition.create(EmptyParticipant.create(), 1),
    ];
    const bracket = new Bracket(crypto.randomUUID(), BracketStatus.DRAFT, initialPositions, testTournament.getId());
    await bracketRepository.create(bracket);

    // Update status and positions
    bracket.publish(); // Changes to PUBLISHED
    bracket.setupPositions([{ position: 1, participant: testParticipant }]);
    await bracketRepository.update(bracket);

    const retrieved = await bracketRepository.findById(bracket.getId());
    expect(retrieved?.getStatus()).toBe(BracketStatus.PUBLISHED);
    
    const updatedPositions = retrieved?.getPositions() || [];
    expect(updatedPositions).toHaveLength(1);
    expect(updatedPositions[0].getParticipant() instanceof RegisteredParticipant).toBe(true);
    expect(updatedPositions[0].getParticipant().getId()).toBe(testParticipant.getId());
  });

  it('should successfully delete a bracket', async () => {
    const bracket = new Bracket(crypto.randomUUID(), BracketStatus.DRAFT, [], testTournament.getId());
    await bracketRepository.create(bracket);

    await bracketRepository.delete(bracket.getId());

    const retrieved = await bracketRepository.findById(bracket.getId());
    expect(retrieved).toBeNull();
  });
});
