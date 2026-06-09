import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentResultsService } from '../../../application/services/TournamentResultsService.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { TournamentResultNotFoundException } from '../../../domain/exceptions/TournamentResultException.js';
import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';

vi.mock('../../../application/dtos/tournamentResult/TournamentResultMapper.js', () => ({
  TournamentResultMapper: {
    toResponse: vi.fn((r) => ({ results: true })),
    toResponsePlayerStats: vi.fn((r) => ({ stats: true })),
  },
}));

describe('TournamentResultsService', () => {
  let service: TournamentResultsService;
  let tournamentRepositoryMock: any;
  let tournamentResultRepositoryMock: any;
  let playerRepositoryMock: any;
  let userRepositoryMock: any;

  beforeEach(() => {
    tournamentRepositoryMock = {
      findById: vi.fn(),
    };
    tournamentResultRepositoryMock = {
      findAllByTournamentIdWithPlayerAndUser: vi.fn(),
      findAllByPlayerIdsWithTournament: vi.fn(),
    };
    playerRepositoryMock = {
      findAllByUserId: vi.fn(),
    };
    userRepositoryMock = {
      findById: vi.fn(),
    };

    service = new TournamentResultsService(
      tournamentRepositoryMock,
      tournamentResultRepositoryMock,
      playerRepositoryMock,
      userRepositoryMock
    );

    vi.clearAllMocks();
  });

  describe('getByTournamentId', () => {
    it('should return tournament results', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      tournamentResultRepositoryMock.findAllByTournamentIdWithPlayerAndUser.mockResolvedValue([{}]);

      const result = await service.getByTournamentId('tournament-id');

      expect(result).toEqual({ results: true });
    });

    it('should throw TournamentNotFoundException if tournament not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(service.getByTournamentId('t')).rejects.toThrow(TournamentNotFoundException);
    });

    it('should throw TournamentResultNotFoundException if no results', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      tournamentResultRepositoryMock.findAllByTournamentIdWithPlayerAndUser.mockResolvedValue([]);
      await expect(service.getByTournamentId('t')).rejects.toThrow(TournamentResultNotFoundException);
    });
  });

  describe('getStatsByUserId', () => {
    it('should return player stats', async () => {
      userRepositoryMock.findById.mockResolvedValue({});
      playerRepositoryMock.findAllByUserId.mockResolvedValue([{ getId: vi.fn().mockReturnValue('p1') }]);
      tournamentResultRepositoryMock.findAllByPlayerIdsWithTournament.mockResolvedValue([{}]);

      const result = await service.getStatsByUserId('user-id');

      expect(result).toEqual({ stats: true });
      expect(tournamentResultRepositoryMock.findAllByPlayerIdsWithTournament).toHaveBeenCalledWith(['p1']);
    });

    it('should throw UserNotFoundException if user not found', async () => {
      userRepositoryMock.findById.mockResolvedValue(null);
      await expect(service.getStatsByUserId('u')).rejects.toThrow(UserNotFoundException);
    });

    it('should return empty array if no player profiles', async () => {
      userRepositoryMock.findById.mockResolvedValue({});
      playerRepositoryMock.findAllByUserId.mockResolvedValue([]);

      const result = await service.getStatsByUserId('u');

      expect(result).toEqual([]);
    });

    it('should return empty array if no historic results', async () => {
      userRepositoryMock.findById.mockResolvedValue({});
      playerRepositoryMock.findAllByUserId.mockResolvedValue([{ getId: vi.fn().mockReturnValue('p1') }]);
      tournamentResultRepositoryMock.findAllByPlayerIdsWithTournament.mockResolvedValue([]);

      const result = await service.getStatsByUserId('u');

      expect(result).toEqual([]);
    });
  });
});
