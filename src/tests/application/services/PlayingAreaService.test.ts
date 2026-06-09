import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlayingAreaService } from '../../../application/services/PlayingAreaService.js';
import { PlayingArea } from '../../../domain/entities/PlayingArea.js';
import { BoardPairedWithTabletException, PlayingAreaAlreadyExistsException, PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';

vi.mock('../../../application/dtos/playingArea/PlayingAreaMapper.js', () => ({
  PlayingAreaMapper: {
    toResponse: vi.fn((p) => ({ id: p.getId() })),
  },
}));

vi.mock('../../../domain/entities/PlayingArea.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    PlayingArea: {
      create: vi.fn(),
    },
  };
});

vi.mock('../../../infrastructure/websockets/SocketServer.js', () => ({
  getSocketServer: vi.fn(() => ({
    sockets: {
      adapter: {
        rooms: new Map(),
      },
    },
  })),
}));

describe('PlayingAreaService', () => {
  let playingAreaService: PlayingAreaService;
  let playingAreaRepositoryMock: any;
  let tournamentRepositoryMock: any;

  beforeEach(() => {
    playingAreaRepositoryMock = {
      findByTournamentId: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    tournamentRepositoryMock = {
      findById: vi.fn(),
    };

    playingAreaService = new PlayingAreaService(
      playingAreaRepositoryMock,
      tournamentRepositoryMock
    );

    vi.clearAllMocks();
  });

  const createMockPlayingArea = (overrides = {}) => ({
    getId: vi.fn().mockReturnValue('playing-area-id'),
    addBoard: vi.fn(),
    removeLastBoard: vi.fn(),
    getBoards: vi.fn().mockReturnValue([]),
    findBoardById: vi.fn().mockReturnValue({ getId: vi.fn().mockReturnValue('board-id') }),
    enableBoard: vi.fn(),
    disableBoard: vi.fn(),
    releaseBoard: vi.fn(),
    ...overrides,
  });

  describe('getByTournamentId', () => {
    it('should return playing area by tournament id', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      const mockPlayingArea = createMockPlayingArea();
      playingAreaRepositoryMock.findByTournamentId.mockResolvedValue(mockPlayingArea);

      const result = await playingAreaService.getByTournamentId('tournament-id');

      expect(tournamentRepositoryMock.findById).toHaveBeenCalledWith('tournament-id');
      expect(playingAreaRepositoryMock.findByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(result.id).toBe('playing-area-id');
    });

    it('should throw TournamentNotFoundException if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(playingAreaService.getByTournamentId('t')).rejects.toThrow(TournamentNotFoundException);
    });

    it('should throw PlayingAreaNotFoundException if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      playingAreaRepositoryMock.findByTournamentId.mockResolvedValue(null);
      await expect(playingAreaService.getByTournamentId('t')).rejects.toThrow(PlayingAreaNotFoundException);
    });
  });

  describe('create', () => {
    it('should create playing area', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      playingAreaRepositoryMock.findByTournamentId.mockResolvedValue(null);
      const mockPlayingArea = createMockPlayingArea();
      (PlayingArea.create as any).mockReturnValue(mockPlayingArea);

      const result = await playingAreaService.create({ id: 'tournament-id', numBoards: 4 });

      expect(PlayingArea.create).toHaveBeenCalledWith('tournament-id', 4);
      expect(playingAreaRepositoryMock.create).toHaveBeenCalledWith(mockPlayingArea);
      expect(result.id).toBe('playing-area-id');
    });

    it('should throw TournamentNotFoundException if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(playingAreaService.create({ id: 't', numBoards: 4 })).rejects.toThrow(TournamentNotFoundException);
    });

    it('should throw PlayingAreaAlreadyExistsException if exists', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      playingAreaRepositoryMock.findByTournamentId.mockResolvedValue({});
      await expect(playingAreaService.create({ id: 't', numBoards: 4 })).rejects.toThrow(PlayingAreaAlreadyExistsException);
    });
  });

  describe('addBoard', () => {
    it('should add board', async () => {
      const mockPlayingArea = createMockPlayingArea();
      playingAreaRepositoryMock.findById.mockResolvedValue(mockPlayingArea);

      await playingAreaService.addBoard('playing-area-id');

      expect(mockPlayingArea.addBoard).toHaveBeenCalled();
      expect(playingAreaRepositoryMock.update).toHaveBeenCalledWith(mockPlayingArea);
    });

    it('should throw PlayingAreaNotFoundException if not found', async () => {
      playingAreaRepositoryMock.findById.mockResolvedValue(null);
      await expect(playingAreaService.addBoard('p')).rejects.toThrow(PlayingAreaNotFoundException);
    });
  });

  describe('removeLastBoard', () => {
    it('should remove last board if no boards', async () => {
      const mockPlayingArea = createMockPlayingArea();
      playingAreaRepositoryMock.findById.mockResolvedValue(mockPlayingArea);

      await playingAreaService.removeLastBoard('playing-area-id');

      expect(mockPlayingArea.removeLastBoard).toHaveBeenCalled();
      expect(playingAreaRepositoryMock.update).not.toHaveBeenCalled(); // Returns early in implementation
    });

    it('should throw PlayingAreaNotFoundException if not found', async () => {
      playingAreaRepositoryMock.findById.mockResolvedValue(null);
      await expect(playingAreaService.removeLastBoard('p')).rejects.toThrow(PlayingAreaNotFoundException);
    });
  });

  describe('enableBoard', () => {
    it('should enable board', async () => {
      const mockPlayingArea = createMockPlayingArea();
      playingAreaRepositoryMock.findById.mockResolvedValue(mockPlayingArea);

      await playingAreaService.enableBoard({ id: 'playing-area-id', boardId: 'board-id' });

      expect(mockPlayingArea.enableBoard).toHaveBeenCalled();
      expect(playingAreaRepositoryMock.update).toHaveBeenCalledWith(mockPlayingArea);
    });

    it('should throw PlayingAreaNotFoundException if not found', async () => {
      playingAreaRepositoryMock.findById.mockResolvedValue(null);
      await expect(playingAreaService.enableBoard({ id: 'p', boardId: 'b' })).rejects.toThrow(PlayingAreaNotFoundException);
    });
  });

  describe('disableBoard', () => {
    it('should disable board', async () => {
      const mockPlayingArea = createMockPlayingArea();
      playingAreaRepositoryMock.findById.mockResolvedValue(mockPlayingArea);

      await playingAreaService.disableBoard({ id: 'playing-area-id', boardId: 'board-id' });

      expect(mockPlayingArea.disableBoard).toHaveBeenCalled();
      expect(playingAreaRepositoryMock.update).toHaveBeenCalledWith(mockPlayingArea);
    });
  });

  describe('releaseBoard', () => {
    it('should release board', async () => {
      const mockPlayingArea = createMockPlayingArea();
      playingAreaRepositoryMock.findById.mockResolvedValue(mockPlayingArea);

      await playingAreaService.releaseBoard({ id: 'playing-area-id', boardId: 'board-id' });

      expect(mockPlayingArea.releaseBoard).toHaveBeenCalled();
      expect(playingAreaRepositoryMock.update).toHaveBeenCalledWith(mockPlayingArea);
    });
  });
});
