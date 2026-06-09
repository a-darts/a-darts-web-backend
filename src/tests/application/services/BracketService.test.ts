import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BracketService } from '../../../application/services/BracketService.js';
import { Bracket } from '../../../domain/entities/Bracket.js';
import { RegistrationNotClosedException } from '../../../domain/exceptions/RegistrationExceptions.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { RegisteredParticipantNotFoundException } from '../../../domain/exceptions/ParticipantExceptions.js';

vi.mock('../../../application/dtos/bracket/BracketMapper.js', () => ({
  BracketMapper: {
    toResponse: vi.fn((b) => ({ id: b.getId(), tournamentId: b.getTournamentId() })),
  },
}));

vi.mock('../../../domain/entities/Bracket.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    Bracket: {
      createManualEmpty: vi.fn(),
      createAutomatically: vi.fn(),
    },
  };
});

describe('BracketService', () => {
  let bracketService: BracketService;
  let bracketRepositoryMock: any;
  let tournamentRepositoryMock: any;
  let registeredParticipantRepositoryMock: any;
  let unitOfWorkMock: any;
  let seedingServiceMock: any;

  beforeEach(() => {
    bracketRepositoryMock = {
      findByTournamentId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    tournamentRepositoryMock = {
      findById: vi.fn(),
      update: vi.fn(),
    };
    registeredParticipantRepositoryMock = {
      countByTournamentId: vi.fn(),
      findAllByTournamentId: vi.fn(),
      findById: vi.fn(),
    };
    unitOfWorkMock = {
      transaction: vi.fn().mockImplementation(async (cb) => {
        await cb();
      }),
    };
    seedingServiceMock = {};

    bracketService = new BracketService(
      bracketRepositoryMock,
      tournamentRepositoryMock,
      registeredParticipantRepositoryMock,
      unitOfWorkMock,
      seedingServiceMock
    );

    vi.clearAllMocks();
  });

  const createMockTournament = (overrides = {}) => ({
    getId: vi.fn().mockReturnValue('tournament-id'),
    isRegistrationClosed: vi.fn().mockReturnValue(true),
    ...overrides,
  });

  const createMockBracket = (overrides = {}) => ({
    getId: vi.fn().mockReturnValue('bracket-id'),
    getTournamentId: vi.fn().mockReturnValue('tournament-id'),
    delete: vi.fn(),
    setupPositions: vi.fn(),
    reshuffle: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
    ...overrides,
  });

  describe('getByTournamentId', () => {
    it('should return bracket by tournament id', async () => {
      const mockTournament = createMockTournament();
      const mockBracket = createMockBracket();
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(mockBracket);

      const result = await bracketService.getByTournamentId('tournament-id');

      expect(tournamentRepositoryMock.findById).toHaveBeenCalledWith('tournament-id');
      expect(bracketRepositoryMock.findByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(result.id).toBe('bracket-id');
    });

    it('should throw TournamentNotFoundException if tournament not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(bracketService.getByTournamentId('tournament-id')).rejects.toThrow(TournamentNotFoundException);
    });

    it('should throw BracketNotFoundException if bracket not found', async () => {
      const mockTournament = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);
      await expect(bracketService.getByTournamentId('tournament-id')).rejects.toThrow(BracketNotFoundException);
    });
  });

  describe('createManually', () => {
    it('should create bracket manually', async () => {
      const mockTournament = createMockTournament();
      const mockBracket = createMockBracket();
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);
      registeredParticipantRepositoryMock.countByTournamentId.mockResolvedValue(4);
      (Bracket.createManualEmpty as any).mockReturnValue(mockBracket);

      const result = await bracketService.createManually({ id: 'tournament-id' });

      expect(tournamentRepositoryMock.findById).toHaveBeenCalledWith('tournament-id');
      expect(mockTournament.isRegistrationClosed).toHaveBeenCalled();
      expect(registeredParticipantRepositoryMock.countByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(Bracket.createManualEmpty).toHaveBeenCalledWith('tournament-id', 4, seedingServiceMock);
      expect(unitOfWorkMock.transaction).toHaveBeenCalled();
      expect(bracketRepositoryMock.create).toHaveBeenCalledWith(mockBracket);
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockTournament);
      expect(result.id).toBe('bracket-id');
    });

    it('should throw TournamentNotFoundException if tournament not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(bracketService.createManually({ id: 't' })).rejects.toThrow(TournamentNotFoundException);
    });

    it('should throw RegistrationNotClosedException if registration is open', async () => {
      const mockTournament = createMockTournament({ isRegistrationClosed: vi.fn().mockReturnValue(false) });
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);
      await expect(bracketService.createManually({ id: 't' })).rejects.toThrow(RegistrationNotClosedException);
    });
  });

  describe('createAutomatically', () => {
    it('should create bracket automatically', async () => {
      const mockTournament = createMockTournament();
      const mockBracket = createMockBracket();
      const mockParticipants = [{}, {}];
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);
      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue(mockParticipants);
      (Bracket.createAutomatically as any).mockReturnValue(mockBracket);

      const result = await bracketService.createAutomatically({ id: 'tournament-id' });

      expect(tournamentRepositoryMock.findById).toHaveBeenCalledWith('tournament-id');
      expect(registeredParticipantRepositoryMock.findAllByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(Bracket.createAutomatically).toHaveBeenCalledWith('tournament-id', mockParticipants, seedingServiceMock);
      expect(bracketRepositoryMock.create).toHaveBeenCalledWith(mockBracket);
      expect(result.id).toBe('bracket-id');
    });
  });

  describe('delete', () => {
    it('should delete bracket', async () => {
      const mockBracket = createMockBracket();
      bracketRepositoryMock.findById.mockResolvedValue(mockBracket);

      await bracketService.delete('bracket-id');

      expect(bracketRepositoryMock.findById).toHaveBeenCalledWith('bracket-id');
      expect(mockBracket.delete).toHaveBeenCalled();
      expect(bracketRepositoryMock.delete).toHaveBeenCalledWith('bracket-id');
    });

    it('should throw BracketNotFoundException if bracket not found', async () => {
      bracketRepositoryMock.findById.mockResolvedValue(null);
      await expect(bracketService.delete('b')).rejects.toThrow(BracketNotFoundException);
    });
  });

  describe('assignParticipantToBracketPosition', () => {
    it('should assign participants correctly', async () => {
      const mockBracket = createMockBracket();
      bracketRepositoryMock.findById.mockResolvedValue(mockBracket);
      const allParticipants = [{ id: 'p1' }, { id: 'p2' }];
      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue(allParticipants);
      const mockParticipant = {};
      registeredParticipantRepositoryMock.findById.mockResolvedValue(mockParticipant);

      await bracketService.assignParticipantToBracketPosition({
        id: 'bracket-id',
        newPositions: [
          { position: 1, participantId: 'p1' },
          { position: 2, participantId: 'p2' },
          { position: 3, participantId: null },
        ]
      });

      expect(mockBracket.setupPositions).toHaveBeenCalled();
      expect(bracketRepositoryMock.update).toHaveBeenCalledWith(mockBracket);
    });

    it('should throw BracketNotFoundException if not found', async () => {
      bracketRepositoryMock.findById.mockResolvedValue(null);
      await expect(bracketService.assignParticipantToBracketPosition({ id: 'b', newPositions: [] })).rejects.toThrow(BracketNotFoundException);
    });

    it('should throw RegisteredParticipantNotFoundException if participant not found', async () => {
      const mockBracket = createMockBracket();
      bracketRepositoryMock.findById.mockResolvedValue(mockBracket);
      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue([{ id: 'p1' }]);
      registeredParticipantRepositoryMock.findById.mockResolvedValue(null);

      await expect(bracketService.assignParticipantToBracketPosition({
        id: 'bracket-id',
        newPositions: [{ position: 1, participantId: 'p1' }]
      })).rejects.toThrow(RegisteredParticipantNotFoundException);
    });
  });

  describe('reshuffle', () => {
    it('should reshuffle bracket', async () => {
      const mockBracket = createMockBracket();
      bracketRepositoryMock.findById.mockResolvedValue(mockBracket);

      const result = await bracketService.reshuffle({ id: 'bracket-id' });

      expect(mockBracket.reshuffle).toHaveBeenCalledWith(seedingServiceMock);
      expect(bracketRepositoryMock.update).toHaveBeenCalledWith(mockBracket);
      expect(result.id).toBe('bracket-id');
    });

    it('should throw BracketNotFoundException if not found', async () => {
      bracketRepositoryMock.findById.mockResolvedValue(null);
      await expect(bracketService.reshuffle({ id: 'b' })).rejects.toThrow(BracketNotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish bracket', async () => {
      const mockBracket = createMockBracket();
      bracketRepositoryMock.findById.mockResolvedValue(mockBracket);

      await bracketService.publish('bracket-id');

      expect(mockBracket.publish).toHaveBeenCalled();
      expect(bracketRepositoryMock.update).toHaveBeenCalledWith(mockBracket);
    });

    it('should throw BracketNotFoundException if not found', async () => {
      bracketRepositoryMock.findById.mockResolvedValue(null);
      await expect(bracketService.publish('b')).rejects.toThrow(BracketNotFoundException);
    });
  });

  describe('unpublish', () => {
    it('should unpublish bracket', async () => {
      const mockBracket = createMockBracket();
      bracketRepositoryMock.findById.mockResolvedValue(mockBracket);

      await bracketService.unpublish('bracket-id');

      expect(mockBracket.unpublish).toHaveBeenCalled();
      expect(bracketRepositoryMock.update).toHaveBeenCalledWith(mockBracket);
    });

    it('should throw BracketNotFoundException if not found', async () => {
      bracketRepositoryMock.findById.mockResolvedValue(null);
      await expect(bracketService.unpublish('b')).rejects.toThrow(BracketNotFoundException);
    });
  });
});
