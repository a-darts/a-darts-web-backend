import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockService = vi.hoisted(() => ({
  createAutomatically: vi.fn(),
  createManually: vi.fn(),
  getByTournamentId: vi.fn(),
  assignParticipantToBracketPosition: vi.fn(),
  reshuffle: vi.fn(),
  publish: vi.fn(),
  unpublish: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/BracketServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { BracketController } from '../../../../infrastructure/web/controllers/BracketController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { 
  TournamentNotFoundException, 
  TournamentAlreadyHasBracketException, 
  TournamentNotPublishedException 
} from '../../../../domain/exceptions/TournamentExceptions.js';
import { 
  RegistratedParticipantsEmptyException, 
  RegisteredParticipantNotFoundException 
} from '../../../../domain/exceptions/ParticipantExceptions.js';
import {
  InvalidPositionsException,
  BracketNotFoundException,
  BracketNotInDraftOrPublisedException,
  DuplicateParticipantsException,
  BracketNotInDraftException,
  BracketNotPublishedException,
  BracketInProgressException,
  BracketAlreadyFinishedException
} from '../../../../domain/exceptions/BracketExceptions.js';
import { AuthRequest } from '../../../../infrastructure/web/middlewares/authMiddleware.js';
import { UserRoles } from '../../../../domain/entities/User.js';
import { BracketStatus } from '../../../../domain/entities/Bracket.js';

describe('BracketController', () => {
  let controller: BracketController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new BracketController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('createBracketAutomatically', () => {
    it('should return 201 when bracket is created automatically', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      const mockBracket = { id: 'bracket-id' };
      mockService.createAutomatically.mockResolvedValue(mockBracket);

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockService.createAutomatically).toHaveBeenCalledWith({ id: 'tournament-id' });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Bracket automatically created successfully',
        data: mockBracket,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createAutomatically.mockRejectedValue(new TournamentNotFoundException());

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });

    it('should return 409 when there are no registered participants', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createAutomatically.mockRejectedValue(new RegistratedParticipantsEmptyException());

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new RegistratedParticipantsEmptyException().message,
      });
    });

    it('should return 409 when tournament already has a bracket', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createAutomatically.mockRejectedValue(new TournamentAlreadyHasBracketException());

      await controller.createBracketAutomatically(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentAlreadyHasBracketException().message,
      });
    });
  });

  describe('createBracketManually', () => {
    it('should return 201 when bracket is created manually', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
      };

      const mockBracket = { id: 'bracket-id' };
      mockService.createManually.mockResolvedValue(mockBracket);

      await controller.createBracketManually(mockRequest as Request, mockResponse as Response);

      expect(mockService.createManually).toHaveBeenCalledWith({ id: 'tournament-id' });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Bracket manually created successfully',
        data: mockBracket,
      });
    });

    it('should return 409 when tournament is not published', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.createManually.mockRejectedValue(new TournamentNotPublishedException());

      await controller.createBracketManually(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotPublishedException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 't-id' } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockService.createManually.mockRejectedValue(new Error('Unknown error'));

      await controller.createBracketManually(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      consoleSpy.mockRestore();
    });
  });

  describe('getTournamentBracket', () => {
    it('should return 200 and bracket successfully', async () => {
      mockRequest = { params: { id: 'tournament-id' }, user: { role: UserRoles.ADMIN } as any };
      const mockBracket = { id: 'bracket-id', status: BracketStatus.PUBLISHED };
      mockService.getByTournamentId.mockResolvedValue(mockBracket);

      await controller.getTournamentBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.getByTournamentId).toHaveBeenCalledWith('tournament-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Bracket fetched successfully',
        data: mockBracket,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };

      await controller.getTournamentBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't-id' } };
      mockService.getByTournamentId.mockRejectedValue(new TournamentNotFoundException());

      await controller.getTournamentBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 404 when fetching DRAFT bracket as non-admin', async () => {
      mockRequest = { params: { id: 't-id' }, user: { role: UserRoles.PLAYER } as any };
      const mockBracket = { id: 'bracket-id', status: BracketStatus.DRAFT };
      mockService.getByTournamentId.mockResolvedValue(mockBracket);

      await controller.getTournamentBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('setupPositions', () => {
    it('should return 200 when positions are assigned', async () => {
      mockRequest = { 
        params: { id: 'bracket-id' }, 
        body: { newPositions: [{ position: 1, participantId: 'p1' }] } 
      };

      await controller.setupPositions(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.assignParticipantToBracketPosition).toHaveBeenCalledWith({
        id: 'bracket-id',
        newPositions: [{ position: 1, participantId: 'p1' }]
      });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 on invalid positions array', async () => {
      mockRequest = { params: { id: 'bracket-id' }, body: { newPositions: [] } };
      await controller.setupPositions(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 on invalid position type', async () => {
      mockRequest = { params: { id: 'bracket-id' }, body: { newPositions: [{ position: '1', participantId: 'p1' }] } };
      await controller.setupPositions(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when bracket not found', async () => {
      mockRequest = { params: { id: 'bracket-id' }, body: { newPositions: [{ position: 1, participantId: 'p1' }] } };
      mockService.assignParticipantToBracketPosition.mockRejectedValue(new BracketNotFoundException());

      await controller.setupPositions(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when bracket is not in draft or published', async () => {
      mockRequest = { params: { id: 'bracket-id' }, body: { newPositions: [{ position: 1, participantId: 'p1' }] } };
      mockService.assignParticipantToBracketPosition.mockRejectedValue(new BracketNotInDraftOrPublisedException());

      await controller.setupPositions(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('reshuffleBracket', () => {
    it('should return 200 and reshuffle bracket', async () => {
      mockRequest = { params: { id: 'bracket-id' } };
      const mockBracket = { id: 'bracket-id' };
      mockService.reshuffle.mockResolvedValue(mockBracket);

      await controller.reshuffleBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.reshuffle).toHaveBeenCalledWith({ id: 'bracket-id' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Bracket reshuffled successfully',
        data: mockBracket,
      });
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };
      await controller.reshuffleBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when bracket not found', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.reshuffle.mockRejectedValue(new BracketNotFoundException());
      await controller.reshuffleBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when bracket not in draft or published', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.reshuffle.mockRejectedValue(new BracketNotInDraftOrPublisedException());
      await controller.reshuffleBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('publishBracket', () => {
    it('should return 200 and publish bracket', async () => {
      mockRequest = { params: { id: 'bracket-id' } };

      await controller.publishBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.publish).toHaveBeenCalledWith('bracket-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when bracket not found', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.publish.mockRejectedValue(new BracketNotFoundException());
      await controller.publishBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when bracket not in draft', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.publish.mockRejectedValue(new BracketNotInDraftException());
      await controller.publishBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('unpublishBracket', () => {
    it('should return 200 and unpublish bracket', async () => {
      mockRequest = { params: { id: 'bracket-id' } };

      await controller.unpublishBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.unpublish).toHaveBeenCalledWith('bracket-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when bracket not found', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.unpublish.mockRejectedValue(new BracketNotFoundException());
      await controller.unpublishBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when bracket not published', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.unpublish.mockRejectedValue(new BracketNotPublishedException());
      await controller.unpublishBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('deleteBracket', () => {
    it('should return 200 and delete bracket', async () => {
      mockRequest = { params: { id: 'bracket-id' } };

      await controller.deleteBracket(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.delete).toHaveBeenCalledWith('bracket-id');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when bracket not found', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.delete.mockRejectedValue(new BracketNotFoundException());
      await controller.deleteBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when bracket in progress', async () => {
      mockRequest = { params: { id: 'b-id' } };
      mockService.delete.mockRejectedValue(new BracketInProgressException());
      await controller.deleteBracket(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });
});
