import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayerService } from '../../../application/services/PlayerService.js';
import { Player, PlayerStatus } from '../../../domain/entities/Player.js';
import { Season } from '../../../domain/entities/Season.js';
import { PlayerAlreadyExistsException, PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';

vi.mock('../../../application/dtos/player/PlayerMapper.js', () => ({
  PlayerMapper: {
    toResponse: vi.fn((p) => ({ id: p.getId() })),
    toResponseWithUser: vi.fn((p) => ({ id: p.player?.getId() || p.getId() })),
  },
}));

vi.mock('../../../domain/entities/Player.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    Player: {
      create: vi.fn(),
    },
  };
});

describe('PlayerService', () => {
  let playerService: PlayerService;
  let playerRepositoryMock: any;
  let userRepositoryMock: any;
  let tournamentRepositoryMock: any;
  let registeredParticipantRepositoryMock: any;
  let tournamentResultRepositoryMock: any;

  beforeEach(() => {
    playerRepositoryMock = {
      findAllWithUser: vi.fn(),
      count: vi.fn(),
      findByIdWithUser: vi.fn(),
      findByUserIdAndSeason: vi.fn(),
      findAllBySeasonWithUser: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    userRepositoryMock = {
      findById: vi.fn(),
    };
    tournamentRepositoryMock = {
      findById: vi.fn(),
    };
    registeredParticipantRepositoryMock = {
      findAllByTournamentId: vi.fn(),
      findAllByPlayerId: vi.fn(),
    };
    tournamentResultRepositoryMock = {
      findAllByPlayerId: vi.fn(),
    };

    playerService = new PlayerService(
      playerRepositoryMock,
      userRepositoryMock,
      tournamentRepositoryMock,
      registeredParticipantRepositoryMock,
      tournamentResultRepositoryMock
    );

    vi.clearAllMocks();
  });

  const createMockPlayer = (overrides = {}) => ({
    getId: vi.fn().mockReturnValue('player-id'),
    updateFederation: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
    ...overrides,
  });

  const createMockTournament = (overrides = {}) => ({
    getId: vi.fn().mockReturnValue('tournament-id'),
    getSeason: vi.fn().mockReturnValue({ getStartYear: vi.fn().mockReturnValue(2023) }),
    ...overrides,
  });

  describe('getAll', () => {
    it('should return all players without pagination', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findAllWithUser.mockResolvedValue([mockPlayer]);

      const result = await playerService.getAll();

      expect(playerRepositoryMock.findAllWithUser).toHaveBeenCalledWith(undefined, undefined, PlayerStatus.ACTIVE);
      expect(result).toHaveLength(1);
    });

    it('should return paginated players', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findAllWithUser.mockResolvedValue([mockPlayer]);
      playerRepositoryMock.count.mockResolvedValue(1);

      const result = await playerService.getAll(1, 10);

      expect(playerRepositoryMock.findAllWithUser).toHaveBeenCalledWith(0, 10, PlayerStatus.ACTIVE);
      expect((result as any).players).toHaveLength(1);
      expect((result as any).pagination.total).toBe(1);
    });
  });

  describe('getById', () => {
    it('should return player by id', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findByIdWithUser.mockResolvedValue(mockPlayer);

      const result = await playerService.getById('player-id');

      expect(playerRepositoryMock.findByIdWithUser).toHaveBeenCalledWith('player-id');
      expect(result.id).toBe('player-id');
    });

    it('should throw PlayerNotFoundException if not found', async () => {
      playerRepositoryMock.findByIdWithUser.mockResolvedValue(null);
      await expect(playerService.getById('player-id')).rejects.toThrow(PlayerNotFoundException);
    });
  });

  describe('getByUserIdAndSeason', () => {
    it('should return player by userId and season', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findByUserIdAndSeason.mockResolvedValue(mockPlayer);

      const result = await playerService.getByUserIdAndSeason({ userId: 'user-id', seasonStartYear: 2023 });

      expect(playerRepositoryMock.findByUserIdAndSeason).toHaveBeenCalledWith('user-id', 2023);
      expect(result.id).toBe('player-id');
    });

    it('should throw PlayerNotFoundException if not found', async () => {
      playerRepositoryMock.findByUserIdAndSeason.mockResolvedValue(null);
      await expect(playerService.getByUserIdAndSeason({ userId: 'user-id', seasonStartYear: 2023 })).rejects.toThrow(PlayerNotFoundException);
    });
  });

  describe('getUnregisteredPlayersInTournament', () => {
    it('should return unregistered players', async () => {
      const mockTournament = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);

      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue([
        { getPlayerId: vi.fn().mockReturnValue('player-1') }
      ]);

      const player1 = { player: { getId: vi.fn().mockReturnValue('player-1') } };
      const player2 = { player: { getId: vi.fn().mockReturnValue('player-2') } };
      playerRepositoryMock.findAllBySeasonWithUser.mockResolvedValue([player1, player2]);

      const result = await playerService.getUnregisteredPlayersInTournament('tournament-id');

      expect(result).toHaveLength(1);
      expect((result as any)[0].id).toBe('player-2');
    });

    it('should throw TournamentNotFoundException if tournament not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(playerService.getUnregisteredPlayersInTournament('t')).rejects.toThrow(TournamentNotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new player', async () => {
      playerRepositoryMock.findByUserIdAndSeason.mockResolvedValue(null);
      userRepositoryMock.findById.mockResolvedValue({});
      const mockPlayer = createMockPlayer();
      (Player.create as any).mockReturnValue(mockPlayer);

      const result = await playerService.create({
        userId: 'user-id',
        registrationNumber: '123',
        federation: 'FED',
        season: { startYear: 2023 } as any
      });

      expect(playerRepositoryMock.findByUserIdAndSeason).toHaveBeenCalledWith('user-id', 2023);
      expect(userRepositoryMock.findById).toHaveBeenCalledWith('user-id');
      expect(Player.create).toHaveBeenCalled();
      expect(playerRepositoryMock.create).toHaveBeenCalledWith(mockPlayer);
      expect(result.id).toBe('player-id');
    });

    it('should throw PlayerAlreadyExistsException if player exists', async () => {
      playerRepositoryMock.findByUserIdAndSeason.mockResolvedValue({});
      await expect(playerService.create({ userId: 'u', season: { startYear: 2023 } } as any)).rejects.toThrow(PlayerAlreadyExistsException);
    });

    it('should throw UserNotFoundException if user does not exist', async () => {
      playerRepositoryMock.findByUserIdAndSeason.mockResolvedValue(null);
      userRepositoryMock.findById.mockResolvedValue(null);
      await expect(playerService.create({ userId: 'u', season: { startYear: 2023 } } as any)).rejects.toThrow(UserNotFoundException);
    });
  });

  describe('updateFederation', () => {
    it('should update player federation', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findById.mockResolvedValue(mockPlayer);

      await playerService.updateFederation({ id: 'player-id', newFederation: 'NEW_FED' });

      expect(mockPlayer.updateFederation).toHaveBeenCalledWith('NEW_FED');
      expect(playerRepositoryMock.update).toHaveBeenCalledWith(mockPlayer);
    });

    it('should throw PlayerNotFoundException if not found', async () => {
      playerRepositoryMock.findById.mockResolvedValue(null);
      await expect(playerService.updateFederation({ id: 'p', newFederation: 'f' })).rejects.toThrow(PlayerNotFoundException);
    });
  });

  describe('delete', () => {
    it('should logically delete if player has history', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findById.mockResolvedValue(mockPlayer);
      registeredParticipantRepositoryMock.findAllByPlayerId.mockResolvedValue([{}]); // Has history

      await playerService.delete('player-id');

      expect(mockPlayer.delete).toHaveBeenCalled();
      expect(playerRepositoryMock.update).toHaveBeenCalledWith(mockPlayer);
      expect(playerRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it('should hard delete if player has no history', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findById.mockResolvedValue(mockPlayer);
      registeredParticipantRepositoryMock.findAllByPlayerId.mockResolvedValue([]);
      tournamentResultRepositoryMock.findAllByPlayerId.mockResolvedValue([]);

      await playerService.delete('player-id');

      expect(mockPlayer.delete).not.toHaveBeenCalled();
      expect(playerRepositoryMock.update).not.toHaveBeenCalled();
      expect(playerRepositoryMock.delete).toHaveBeenCalledWith('player-id');
    });

    it('should throw PlayerNotFoundException if not found', async () => {
      playerRepositoryMock.findById.mockResolvedValue(null);
      await expect(playerService.delete('p')).rejects.toThrow(PlayerNotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore player', async () => {
      const mockPlayer = createMockPlayer();
      playerRepositoryMock.findById.mockResolvedValue(mockPlayer);

      await playerService.restore('player-id');

      expect(mockPlayer.restore).toHaveBeenCalled();
      expect(playerRepositoryMock.update).toHaveBeenCalledWith(mockPlayer);
    });

    it('should throw PlayerNotFoundException if not found', async () => {
      playerRepositoryMock.findById.mockResolvedValue(null);
      await expect(playerService.restore('p')).rejects.toThrow(PlayerNotFoundException);
    });
  });
});
