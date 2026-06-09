import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { MatchController } from '../../../../infrastructure/web/controllers/MatchController.js';
import { MissingRequiredUserFieldsException, InvalidUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import {
  MatchNotFoundException,
  MatchNotPendingException,
  MatchNotInProgressException,
  MatchAlreadyFinishedException,
  MatchNotSuspendedException
} from '../../../../domain/exceptions/MatchExceptions.js';
import {
  PlayingAreaNotFoundException,
  BoardNotFoundException,
  BoardNotOccupiedException,
  BoardAlreadyOccupiedException,
  BoardDisabledException
} from '../../../../domain/exceptions/PlayingAreaExceptions.js';
import { BracketNotFoundException } from '../../../../domain/exceptions/BracketExceptions.js';
import { AuthRequest } from '../../../../infrastructure/web/middlewares/authMiddleware.js';


const mockService = vi.hoisted(() => ({
  getAllByTournamentId: vi.fn(),
  getById: vi.fn(),
  start: vi.fn(),
  finish: vi.fn(),
  cancel: vi.fn(),
  suspend: vi.fn(),
  resume: vi.fn(),
  setBoardNumber: vi.fn(),
  updateScore: vi.fn(),
  setResultAndPromote: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/MatchServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));


describe('MatchController', () => {
  let controller: MatchController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new MatchController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getMatchesByTournamentId', () => {
    it('should return 200 and matches successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      const mockMatches = [{ id: 'match-id' }];
      mockService.getAllByTournamentId.mockResolvedValue(mockMatches);

      await controller.getMatchesByTournamentId(mockRequest as Request, mockResponse as Response);

      expect(mockService.getAllByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Matches fetched successfully',
        data: mockMatches,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.getMatchesByTournamentId(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.getAllByTournamentId.mockRejectedValue(new TournamentNotFoundException());

      await controller.getMatchesByTournamentId(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('getMatchById', () => {
    it('should return 200 and match successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };

      const mockMatch = { id: 'match-id' };
      mockService.getById.mockResolvedValue(mockMatch);

      await controller.getMatchById(mockRequest as Request, mockResponse as Response);

      expect(mockService.getById).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when match is not found', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.getById.mockRejectedValue(new MatchNotFoundException());

      await controller.getMatchById(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('startMatch', () => {
    it('should return 200 when match starts successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };

      await controller.startMatch(mockRequest as Request, mockResponse as Response);

      expect(mockService.start).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 409 when match is not pending', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.start.mockRejectedValue(new MatchNotPendingException());

      await controller.startMatch(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 'match-id' } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      mockService.start.mockRejectedValue(new Error('Unknown'));

      await controller.startMatch(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      consoleSpy.mockRestore();
    });
  });

  describe('finishMatch', () => {
    it('should return 200 and finish match successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };

      await controller.finishMatch(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.finish).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };
      await controller.finishMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when match not found', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.finish.mockRejectedValue(new MatchNotFoundException());
      await controller.finishMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when match not in progress', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.finish.mockRejectedValue(new MatchNotInProgressException());
      await controller.finishMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('cancelMatch', () => {
    it('should return 200 and cancel match successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };
      await controller.cancelMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.cancel).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when match not found', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.cancel.mockRejectedValue(new MatchNotFoundException());
      await controller.cancelMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when match already finished', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.cancel.mockRejectedValue(new MatchAlreadyFinishedException());
      await controller.cancelMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('suspendMatch', () => {
    it('should return 200 and suspend match successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };
      await controller.suspendMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.suspend).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when match not found', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.suspend.mockRejectedValue(new MatchNotFoundException());
      await controller.suspendMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when match not in progress', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.suspend.mockRejectedValue(new MatchNotInProgressException());
      await controller.suspendMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('resumeMatch', () => {
    it('should return 200 and resume match successfully', async () => {
      mockRequest = { params: { id: 'match-id' } };
      await controller.resumeMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.resume).toHaveBeenCalledWith('match-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when match not found', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.resume.mockRejectedValue(new MatchNotFoundException());
      await controller.resumeMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when match not suspended', async () => {
      mockRequest = { params: { id: 'match-id' } };
      mockService.resume.mockRejectedValue(new MatchNotSuspendedException());
      await controller.resumeMatch(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('setMatchBoardNumber', () => {
    it('should return 200 and set board number successfully', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { boardNumber: 1 } };
      await controller.setMatchBoardNumber(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.setBoardNumber).toHaveBeenCalledWith({ id: 'match-id', boardNumber: 1 });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when boardNumber is missing', async () => {
      mockRequest = { params: { id: 'match-id' }, body: {} };
      await controller.setMatchBoardNumber(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when board not found', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { boardNumber: 1 } };
      mockService.setBoardNumber.mockRejectedValue(new BoardNotFoundException());
      await controller.setMatchBoardNumber(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when board already occupied', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { boardNumber: 1 } };
      mockService.setBoardNumber.mockRejectedValue(new BoardAlreadyOccupiedException());
      await controller.setMatchBoardNumber(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('updateMatchScore', () => {
    it('should return 200 and update score successfully', async () => {
      mockRequest = {
        params: { id: 'match-id' },
        body: { p1Sets: 1, p1Legs: 2, p2Sets: 0, p2Legs: 1 }
      };
      await controller.updateMatchScore(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.updateScore).toHaveBeenCalledWith({
        id: 'match-id',
        participant1Sets: 1,
        participant1Legs: 2,
        participant2Sets: 0,
        participant2Legs: 1
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when fields are missing', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { p1Sets: 1 } };
      await controller.updateMatchScore(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 when fields have invalid types', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { p1Sets: '1', p1Legs: 2, p2Sets: 0, p2Legs: 1 } };
      await controller.updateMatchScore(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when bracket not found', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { p1Sets: 1, p1Legs: 2, p2Sets: 0, p2Legs: 1 } };
      mockService.updateScore.mockRejectedValue(new BracketNotFoundException());
      await controller.updateMatchScore(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('setMatchResult', () => {
    it('should return 200 and set result successfully', async () => {
      mockRequest = {
        params: { id: 'match-id' },
        body: { p1Sets: 1, p1Legs: 2, p2Sets: 0, p2Legs: 1 }
      };
      await controller.setMatchResult(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.setResultAndPromote).toHaveBeenCalledWith({
        id: 'match-id',
        participant1Sets: 1,
        participant1Legs: 2,
        participant2Sets: 0,
        participant2Legs: 1
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when fields are missing', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { p1Sets: 1 } };
      await controller.setMatchResult(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when match not found', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { p1Sets: 1, p1Legs: 2, p2Sets: 0, p2Legs: 1 } };
      mockService.setResultAndPromote.mockRejectedValue(new MatchNotFoundException());
      await controller.setMatchResult(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when match already finished', async () => {
      mockRequest = { params: { id: 'match-id' }, body: { p1Sets: 1, p1Legs: 2, p2Sets: 0, p2Legs: 1 } };
      mockService.setResultAndPromote.mockRejectedValue(new MatchAlreadyFinishedException());
      await controller.setMatchResult(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });
});
