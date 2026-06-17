import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthRequest } from '../../../../infrastructure/web/middlewares/authMiddleware.js';
import { TournamentController } from '../../../../infrastructure/web/controllers/TournamentController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import {
  TournamentNotFoundException,
  InvalidTournamentStatusException,
  TournamentNotDeletedException,
  TournamentNotInDraftException,
  TournamentNotPublishedException,
  TournamentAlreadyFinishedException,
  TournamentNotInDraftOrPublishedException,
  TournamentAlreadyHasBracketException,
  TournamentMaxPlayersExceededException
} from '../../../../domain/exceptions/TournamentExceptions.js';
import {
  RegistrationAlreadyOpenException,
  RegistrationAlreadyClosedException,
  CheckInAlreadyEnabledException,
  CheckInAlreadyDisabledException,
  InvalidRegistrationPeriodException,
  RegistrationCloseDateInPastException,
  RegistrationNotClosedException
} from '../../../../domain/exceptions/RegistrationExceptions.js';
import {
  BracketNotPublishedException,
  BracketNotInDraftOrPublisedException
} from '../../../../domain/exceptions/BracketExceptions.js';
import { UserRoles } from '../../../../domain/entities/User.js';
import { TournamentStatus } from '../../../../domain/entities/Tournament.js';


const mockService = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  delete: vi.fn(),
  restore: vi.fn(),
  unpublish: vi.fn(),
  publish: vi.fn(),
  cancel: vi.fn(),
  start: vi.fn(),
  updateInfo: vi.fn(),
  updateNameAndSeason: vi.fn(),
  openRegistration: vi.fn(),
  closeRegistration: vi.fn(),
  updateRegistrationPeriod: vi.fn(),
  enableCheckIn: vi.fn(),
  disableCheckIn: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/TournamentServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));


describe('TournamentController', () => {
  let controller: TournamentController;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new TournamentController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('getAllTournaments', () => {
    it('should return 200 and tournaments successfully', async () => {
      mockRequest = {
        query: { page: '1', limit: '10' },
        user: { role: UserRoles.ADMIN, id: 'admin-id' } as any,
      };

      const mockTournaments = { tournaments: [], pagination: { total: 0 } };
      mockService.getAll.mockResolvedValue(mockTournaments);

      await controller.getAllTournaments(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.getAll).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid page number', async () => {
      mockRequest = { query: { page: '-1' } };
      await controller.getAllTournaments(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('getTournamentById', () => {
    it('should return 200 and tournament successfully', async () => {
      mockRequest = { params: { id: 'tournament-id' }, user: { role: UserRoles.ADMIN } as any };
      const mockTournament = { id: 'tournament-id', status: TournamentStatus.PUBLISHED };
      mockService.getById.mockResolvedValue(mockTournament);

      await controller.getTournamentById(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };
      await controller.getTournamentById(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 'tournament-id' }, user: { role: UserRoles.ADMIN } as any };
      mockService.getById.mockRejectedValue(new TournamentNotFoundException());
      await controller.getTournamentById(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('createTournament', () => {
    it('should return 201 when tournament created', async () => {
      mockRequest = { body: { name: 'T1' }, user: { id: 'admin-id' } as any };
      const mockTournament = { id: 't1' };
      mockService.create.mockResolvedValue(mockTournament);

      await controller.createTournament(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockService.create).toHaveBeenCalledWith({ name: 'T1', userId: 'admin-id' });
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('should return 401 when user is not present', async () => {
      mockRequest = { body: {} };
      await controller.createTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(401);
    });

    it('should return 400 when missing required fields', async () => {
      mockRequest = { body: {}, user: { id: 'admin-id' } as any };
      mockService.create.mockRejectedValue(new MissingRequiredUserFieldsException());
      await controller.createTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteTournament', () => {
    it('should return 200 when tournament deleted', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.deleteTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.delete).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.delete.mockRejectedValue(new TournamentNotFoundException());
      await controller.deleteTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when tournament not in draft or published', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.delete.mockRejectedValue(new TournamentNotInDraftOrPublishedException());
      await controller.deleteTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('restoreTournament', () => {
    it('should return 200 when tournament restored', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.restoreTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.restore).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.restore.mockRejectedValue(new TournamentNotFoundException());
      await controller.restoreTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when tournament not deleted', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.restore.mockRejectedValue(new TournamentNotDeletedException());
      await controller.restoreTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('unpublishTournament', () => {
    it('should return 200 when unpublished', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.unpublishTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.unpublish).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.unpublish.mockRejectedValue(new TournamentNotFoundException());
      await controller.unpublishTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when not published', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.unpublish.mockRejectedValue(new TournamentNotPublishedException());
      await controller.unpublishTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });

    it('should return 409 when bracket not published', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.unpublish.mockRejectedValue(new BracketNotPublishedException());
      await controller.unpublishTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('publishTournament', () => {
    it('should return 200 when published', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.publishTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.publish).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.publish.mockRejectedValue(new TournamentNotFoundException());
      await controller.publishTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when not in draft', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.publish.mockRejectedValue(new TournamentNotInDraftException());
      await controller.publishTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });


  });

  describe('cancelTournament', () => {
    it('should return 200 when cancelled', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.cancelTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.cancel).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.cancel.mockRejectedValue(new TournamentNotFoundException());
      await controller.cancelTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when already finished', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.cancel.mockRejectedValue(new TournamentAlreadyFinishedException());
      await controller.cancelTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('startTournament', () => {
    it('should return 200 when started', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.startTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.start).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.start.mockRejectedValue(new TournamentNotFoundException());
      await controller.startTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when tournament not published', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.start.mockRejectedValue(new TournamentNotPublishedException());
      await controller.startTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });

    it('should return 409 when bracket not in draft or published', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.start.mockRejectedValue(new BracketNotInDraftOrPublisedException());
      await controller.startTournament(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('updateTournamentInfo', () => {
    it('should return 200 when info updated', async () => {
      mockRequest = { params: { id: 't1' }, body: { newInfo: { location: 'L1' } } };
      await controller.updateTournamentInfo(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.updateInfo).toHaveBeenCalledWith({ id: 't1', newInfo: { location: 'L1' } });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' }, body: { newInfo: { location: 'L1' } } };
      mockService.updateInfo.mockRejectedValue(new TournamentNotFoundException());
      await controller.updateTournamentInfo(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when tournament not in draft', async () => {
      mockRequest = { params: { id: 't1' }, body: { newInfo: { location: 'L1' } } };
      mockService.updateInfo.mockRejectedValue(new TournamentNotInDraftException());
      await controller.updateTournamentInfo(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('updateTournamentNameAndSeason', () => {
    it('should return 200 when name updated', async () => {
      mockRequest = { params: { id: 't1' }, body: { newName: 'N1' } };
      await controller.updateTournamentNameAndSeason(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.updateNameAndSeason).toHaveBeenCalledWith({ id: 't1', newName: 'N1' });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 200 when season updated', async () => {
      mockRequest = { params: { id: 't1' }, body: { newSeasonStartYear: 2029 } };
      await controller.updateTournamentNameAndSeason(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.updateNameAndSeason).toHaveBeenCalledWith({ id: 't1', newSeasonStartYear: 2029 });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing name and season', async () => {
      mockRequest = { params: { id: 't1' }, body: {} };
      await controller.updateTournamentNameAndSeason(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' }, body: { newName: 'N1' } };
      mockService.updateNameAndSeason.mockRejectedValue(new TournamentNotFoundException());
      await controller.updateTournamentNameAndSeason(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when tournament not in draft', async () => {
      mockRequest = { params: { id: 't1' }, body: { newName: 'N1' } };
      mockService.updateNameAndSeason.mockRejectedValue(new TournamentNotInDraftException());
      await controller.updateTournamentNameAndSeason(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('openRegistration', () => {
    it('should return 200 when opened', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.openRegistration(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.openRegistration).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.openRegistration.mockRejectedValue(new TournamentNotFoundException());
      await controller.openRegistration(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when already open', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.openRegistration.mockRejectedValue(new RegistrationAlreadyOpenException());
      await controller.openRegistration(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('closeRegistration', () => {
    it('should return 200 when closed', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.closeRegistration(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.closeRegistration).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.closeRegistration.mockRejectedValue(new TournamentNotFoundException());
      await controller.closeRegistration(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when already closed', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.closeRegistration.mockRejectedValue(new RegistrationAlreadyClosedException());
      await controller.closeRegistration(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('updateTournamentRegistrationPeriod', () => {
    it('should return 200 when updated', async () => {
      const dates = { startDate: new Date().toISOString(), endDate: new Date().toISOString() };
      mockRequest = { params: { id: 't1' }, body: { newRegistrationPeriod: dates } };
      await controller.updateTournamentRegistrationPeriod(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.updateRegistrationPeriod).toHaveBeenCalledWith({ id: 't1', newRegistrationPeriod: dates });
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 400 when missing fields', async () => {
      mockRequest = { params: { id: 't1' }, body: {} };
      await controller.updateTournamentRegistrationPeriod(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid period', async () => {
      const dates = { startDate: new Date().toISOString(), endDate: new Date().toISOString() };
      mockRequest = { params: { id: 't1' }, body: { newRegistrationPeriod: dates } };
      mockService.updateRegistrationPeriod.mockRejectedValue(new InvalidRegistrationPeriodException());
      await controller.updateTournamentRegistrationPeriod(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 404 when tournament not found', async () => {
      const dates = { startDate: new Date().toISOString(), endDate: new Date().toISOString() };
      mockRequest = { params: { id: 't1' }, body: { newRegistrationPeriod: dates } };
      mockService.updateRegistrationPeriod.mockRejectedValue(new TournamentNotFoundException());
      await controller.updateTournamentRegistrationPeriod(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('enableCheckIn', () => {
    it('should return 200 when enabled', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.enableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.enableCheckIn).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.enableCheckIn.mockRejectedValue(new TournamentNotFoundException());
      await controller.enableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when already enabled', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.enableCheckIn.mockRejectedValue(new CheckInAlreadyEnabledException());
      await controller.enableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
  });

  describe('disableCheckIn', () => {
    it('should return 200 when disabled', async () => {
      mockRequest = { params: { id: 't1' } };
      await controller.disableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockService.disableCheckIn).toHaveBeenCalledWith('t1');
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('should return 404 when tournament not found', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.disableCheckIn.mockRejectedValue(new TournamentNotFoundException());
      await controller.disableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(404);
    });

    it('should return 409 when already disabled', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.disableCheckIn.mockRejectedValue(new CheckInAlreadyDisabledException());
      await controller.disableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(409);
    });
    it('should return 400 when id is missing', async () => {
      mockRequest = { params: {} };
      await controller.disableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 500 on internal server error', async () => {
      mockRequest = { params: { id: 't1' } };
      mockService.disableCheckIn.mockRejectedValue(new Error('Unknown error'));
      await controller.disableCheckIn(mockRequest as AuthRequest, mockResponse as Response);
      expect(mockStatus).toHaveBeenCalledWith(500);
    });
  });
});
