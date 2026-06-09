import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentService } from '../../../application/services/TournamentService.js';
import { Tournament, TournamentStatus } from '../../../domain/entities/Tournament.js';
import { BracketNotFoundException, BracketUnfinishedException } from '../../../domain/exceptions/BracketExceptions.js';
import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { MatchStatus } from '../../../domain/entities/Match.js';

vi.mock('../../../application/dtos/tournament/TournamentMapper.js', () => ({
  TournamentMapper: {
    toResponse: vi.fn((t) => ({ id: t.getId(), name: t.getName() })),
  },
}));

vi.mock('../../../domain/entities/Tournament.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    Tournament: {
      create: vi.fn(),
    },
  };
});

describe('TournamentService', () => {
  let tournamentService: TournamentService;
  let tournamentRepositoryMock: any;
  let bracketRepositoryMock: any;
  let registeredParticipantRepositoryMock: any;
  let playingAreaRepositoryMock: any;
  let tournamentResultRepositoryMock: any;
  let matchRepositoryMock: any;
  let matchGeneratorMock: any;
  let eventBusMock: any;
  let unitOfWorkMock: any;

  beforeEach(() => {
    tournamentRepositoryMock = {
      findAll: vi.fn(),
      findById: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    bracketRepositoryMock = {
      findByTournamentId: vi.fn(),
      update: vi.fn(),
    };
    registeredParticipantRepositoryMock = {
      countByTournamentId: vi.fn(),
      findAllByTournamentId: vi.fn(),
    };
    playingAreaRepositoryMock = {
      findByTournamentId: vi.fn(),
    };
    tournamentResultRepositoryMock = {
      findAllByTournamentId: vi.fn(),
    };
    matchRepositoryMock = {
      create: vi.fn(),
      update: vi.fn(),
      findManyByTournamentId: vi.fn(),
    };
    matchGeneratorMock = {
      generateMatches: vi.fn(),
    };
    eventBusMock = {
      publish: vi.fn(),
    };
    unitOfWorkMock = {
      transaction: vi.fn(async (cb) => {
        await cb();
      }),
    };

    tournamentService = new TournamentService(
      tournamentRepositoryMock,
      bracketRepositoryMock,
      registeredParticipantRepositoryMock,
      playingAreaRepositoryMock,
      tournamentResultRepositoryMock,
      matchRepositoryMock,
      matchGeneratorMock,
      eventBusMock,
      unitOfWorkMock
    );
    
    vi.clearAllMocks();
  });

  const createMockTournament = (overrides = {}) => {
    return {
      getId: vi.fn().mockReturnValue('tournament-id'),
      getName: vi.fn().mockReturnValue('Tournament Name'),
      getStatus: vi.fn().mockReturnValue(TournamentStatus.DRAFT),
      updateName: vi.fn(),
      start: vi.fn(),
      cancel: vi.fn(),
      publish: vi.fn(),
      unpublish: vi.fn(),
      updateInfo: vi.fn(),
      delete: vi.fn(),
      restore: vi.fn(),
      openRegistration: vi.fn(),
      closeRegistration: vi.fn(),
      scheduleRegistration: vi.fn(),
      enableCheckIn: vi.fn(),
      disableCheckIn: vi.fn(),
      pullEvents: vi.fn().mockReturnValue([]),
      getRegistration: vi.fn().mockReturnValue({
        getRegistrationPeriod: vi.fn().mockReturnValue({
          hasSchedule: vi.fn().mockReturnValue(false),
          isOpen: vi.fn().mockReturnValue(false),
        }),
        isClosed: vi.fn().mockReturnValue(true),
        isOpen: vi.fn().mockReturnValue(false),
      }),
      ...overrides,
    };
  };

  const createMockBracket = (overrides = {}) => {
    return {
      getTournamentId: vi.fn().mockReturnValue('tournament-id'),
      getPositions: vi.fn().mockReturnValue([]),
      start: vi.fn(),
      cancel: vi.fn(),
      isPublished: vi.fn().mockReturnValue(false),
      unpublish: vi.fn(),
      pullEvents: vi.fn().mockReturnValue([]),
      ...overrides,
    };
  };

  describe('getAll', () => {
    it('should return all tournaments without pagination', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findAll.mockResolvedValue([mockT]);

      const result = await tournamentService.getAll();

      expect(tournamentRepositoryMock.findAll).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, undefined);
      expect(result).toHaveLength(1);
      expect((result as any)[0].id).toBe('tournament-id');
    });

    it('should return paginated tournaments when page and limit are provided', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findAll.mockResolvedValue([mockT]);
      tournamentRepositoryMock.count.mockResolvedValue(1);

      const result = await tournamentService.getAll(1, 10);

      expect(tournamentRepositoryMock.findAll).toHaveBeenCalledWith(0, 10, undefined, undefined, undefined);
      expect(tournamentRepositoryMock.count).toHaveBeenCalled();
      expect((result as any).tournaments).toHaveLength(1);
      expect((result as any).pagination.total).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return tournament by id', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);

      const result = await tournamentService.getById('tournament-id');

      expect(tournamentRepositoryMock.findById).toHaveBeenCalledWith('tournament-id');
      expect(result.id).toBe('tournament-id');
    });

    it('should throw TournamentNotFoundException if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);

      await expect(tournamentService.getById('tournament-id')).rejects.toThrow(TournamentNotFoundException);
    });
  });

  describe('create', () => {
    it('should create and persist a new tournament', async () => {
      const mockRequest = {
        name: 'New Tournament',
        seasonStartYear: 2024,
        info: {
          place: 'Place', dateTime: new Date(), mode: 'mode', game: 'game', schedule: 'schedule',
          maxPlayers: 10, gameType: 'type', numLegs: 3, numSets: 1, rules: 'rules', info: 'info', federation: 'fed'
        },
        userId: 'user-id'
      };

      const mockT = createMockTournament();
      (Tournament.create as any).mockReturnValue(mockT);

      const result = await tournamentService.create(mockRequest as any);

      expect(Tournament.create).toHaveBeenCalled();
      expect(tournamentRepositoryMock.create).toHaveBeenCalledWith(mockT);
      expect(result.id).toBe('tournament-id');
    });
  });

  describe('updateName', () => {
    it('should update name and persist', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);

      await tournamentService.updateName({ id: 'tournament-id', newName: 'New Name' });

      expect(mockT.updateName).toHaveBeenCalledWith('New Name');
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should throw if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(tournamentService.updateName({ id: 't-id', newName: 'name' })).rejects.toThrow(TournamentNotFoundException);
    });
  });

  describe('start', () => {
    it('should start tournament and bracket and generate matches', async () => {
      const mockT = createMockTournament();
      const mockB = createMockBracket({
        getPositions: vi.fn().mockReturnValue([{ isBye: () => false, isEmpty: () => false }])
      });
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(mockB);
      registeredParticipantRepositoryMock.countByTournamentId.mockResolvedValue(1); // Matches real participants (1)
      matchGeneratorMock.generateMatches.mockReturnValue([{ id: 'match-1' }]);

      await tournamentService.start('tournament-id');

      expect(mockT.start).toHaveBeenCalled();
      expect(mockB.start).toHaveBeenCalled();
      expect(matchGeneratorMock.generateMatches).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
      expect(bracketRepositoryMock.update).toHaveBeenCalledWith(mockB);
      expect(matchRepositoryMock.create).toHaveBeenCalledWith({ id: 'match-1' });
    });

    it('should throw BracketNotFoundException if no bracket', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);

      await expect(tournamentService.start('t-id')).rejects.toThrow(BracketNotFoundException);
    });

    it('should throw BracketUnfinishedException if participants mismatch', async () => {
      const mockT = createMockTournament();
      const mockB = createMockBracket({
        getPositions: vi.fn().mockReturnValue([{ isBye: () => false, isEmpty: () => false }])
      });
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(mockB);
      registeredParticipantRepositoryMock.countByTournamentId.mockResolvedValue(0); // Mismatch

      await expect(tournamentService.start('t-id')).rejects.toThrow(BracketUnfinishedException);
    });
  });

  describe('cancel', () => {
    it('should cancel tournament, bracket, and matches and publish events', async () => {
      const mockT = createMockTournament({
        pullEvents: vi.fn().mockReturnValue([{ type: 't-event' }])
      });
      const mockB = createMockBracket({
        pullEvents: vi.fn().mockReturnValue([{ type: 'b-event' }])
      });
      const mockM = { getStatus: () => MatchStatus.IN_PROGRESS, cancel: vi.fn(), getId: () => 'm-id' };
      const mockBoard = { getShortId: () => 'board-1' };
      const mockPlayingArea = { findBoardByMatchId: vi.fn().mockReturnValue(mockBoard) };

      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(mockB);
      matchRepositoryMock.findManyByTournamentId.mockResolvedValue([mockM]);
      playingAreaRepositoryMock.findByTournamentId.mockResolvedValue(mockPlayingArea);

      await tournamentService.cancel('tournament-id');

      expect(mockT.cancel).toHaveBeenCalled();
      expect(mockB.cancel).toHaveBeenCalled();
      expect(mockM.cancel).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
      expect(bracketRepositoryMock.update).toHaveBeenCalledWith(mockB);
      expect(matchRepositoryMock.update).toHaveBeenCalledWith(mockM);
      expect(eventBusMock.publish).toHaveBeenCalled();
    });
  });

  describe('publish / unpublish', () => {
    it('should publish tournament', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);

      await tournamentService.publish('t-id');

      expect(mockT.publish).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should unpublish tournament and bracket', async () => {
      const mockT = createMockTournament();
      const mockB = createMockBracket({ isPublished: () => true });
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(mockB);

      await tournamentService.unpublish('t-id');

      expect(mockT.unpublish).toHaveBeenCalled();
      expect(mockB.unpublish).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
      expect(bracketRepositoryMock.update).toHaveBeenCalledWith(mockB);
    });
  });

  describe('delete / restore', () => {
    it('should delete from DB if no registers exist', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue([]);
      matchRepositoryMock.findManyByTournamentId.mockResolvedValue([]);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);
      playingAreaRepositoryMock.findByTournamentId.mockResolvedValue(null);
      tournamentResultRepositoryMock.findAllByTournamentId.mockResolvedValue([]);

      await tournamentService.delete('t-id');

      expect(mockT.delete).toHaveBeenCalled();
      expect(tournamentRepositoryMock.delete).toHaveBeenCalledWith('t-id');
    });

    it('should logical delete (update) if registers exist', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue([{ id: 'reg-1' }]);

      await tournamentService.delete('t-id');

      expect(mockT.delete).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should restore tournament', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);

      await tournamentService.restore('t-id');

      expect(mockT.restore).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });
  });

  describe('Registration Methods', () => {
    it('should open registration', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);

      await tournamentService.openRegistration('t-id');

      expect(mockT.openRegistration).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should close registration', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);

      await tournamentService.closeRegistration('t-id');

      expect(mockT.closeRegistration).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should throw if opening registration with bracket', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(createMockBracket());

      await expect(tournamentService.openRegistration('t-id')).rejects.toThrow(TournamentAlreadyHasBracketException);
    });

    it('should enable check-in', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);

      await tournamentService.enableCheckIn('t-id');

      expect(mockT.enableCheckIn).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should disable check-in', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);

      await tournamentService.disableCheckIn('t-id');

      expect(mockT.disableCheckIn).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should update registration period', async () => {
      const mockT = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockT);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);

      await tournamentService.updateRegistrationPeriod({
        id: 't-id',
        newRegistrationPeriod: { startsAt: new Date(), endsAt: new Date() }
      } as any);

      expect(mockT.scheduleRegistration).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });
  });

  describe('processRegistrationPeriods', () => {
    it('should open registration if period should be open and registration is closed', async () => {
      const mockT = createMockTournament({
        getStatus: vi.fn().mockReturnValue(TournamentStatus.PUBLISHED),
        getRegistration: vi.fn().mockReturnValue({
          getRegistrationPeriod: vi.fn().mockReturnValue({
            hasSchedule: vi.fn().mockReturnValue(true),
            isOpen: vi.fn().mockReturnValue(true),
          }),
          isClosed: vi.fn().mockReturnValue(true),
          isOpen: vi.fn().mockReturnValue(false),
        })
      });
      tournamentRepositoryMock.findAll.mockResolvedValue([mockT]);

      await tournamentService.processRegistrationPeriods();

      expect(mockT.openRegistration).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should close registration if period should not be open and registration is open', async () => {
      const mockT = createMockTournament({
        getStatus: vi.fn().mockReturnValue(TournamentStatus.PUBLISHED),
        getRegistration: vi.fn().mockReturnValue({
          getRegistrationPeriod: vi.fn().mockReturnValue({
            hasSchedule: vi.fn().mockReturnValue(true),
            isOpen: vi.fn().mockReturnValue(false),
          }),
          isClosed: vi.fn().mockReturnValue(false),
          isOpen: vi.fn().mockReturnValue(true),
        })
      });
      tournamentRepositoryMock.findAll.mockResolvedValue([mockT]);

      await tournamentService.processRegistrationPeriods();

      expect(mockT.closeRegistration).toHaveBeenCalled();
      expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockT);
    });

    it('should do nothing if period has no schedule', async () => {
      const mockT = createMockTournament({
        getStatus: vi.fn().mockReturnValue(TournamentStatus.PUBLISHED)
      });
      tournamentRepositoryMock.findAll.mockResolvedValue([mockT]);

      await tournamentService.processRegistrationPeriods();

      expect(mockT.openRegistration).not.toHaveBeenCalled();
      expect(mockT.closeRegistration).not.toHaveBeenCalled();
    });
  });
});
