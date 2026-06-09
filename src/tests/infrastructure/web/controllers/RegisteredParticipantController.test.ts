import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';

const mockService = vi.hoisted(() => ({
  registerParticipantInTournament: vi.fn(),
  unregisterParticipantFromTournament: vi.fn(),
  doCheckInParticipant: vi.fn(),
  undoCheckInParticipant: vi.fn(),
}));

vi.mock('../../../../infrastructure/factories/RegisteredParticipantServiceFactory.js', () => ({
  default: {
    getInstance: vi.fn(() => mockService),
  },
}));

import { RegisteredParticipantController } from '../../../../infrastructure/web/controllers/RegisteredParticipantController.js';
import { MissingRequiredUserFieldsException } from '../../../../domain/exceptions/UserExceptions.js';
import { TournamentNotFoundException, TournamentMaxPlayersExceededException, TournamentAlreadyHasBracketException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { ParticipantAlreadyRegisteredException, ParticipantNotRegisteredException, RegisteredParticipantNotFoundException, ParticipantAlreadyCheckedInException } from '../../../../domain/exceptions/ParticipantExceptions.js';

describe('RegisteredParticipantController', () => {
  let controller: RegisteredParticipantController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: any;
  let mockStatus: any;

  beforeEach(() => {
    controller = new RegisteredParticipantController();

    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });

    mockResponse = {
      status: mockStatus,
    };

    vi.clearAllMocks();
  });

  describe('registerParticipant', () => {
    it('should return 201 when registered successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id' },
        body: { playerId: 'player-id' },
      };

      await controller.registerParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockService.registerParticipantInTournament).toHaveBeenCalledWith({ id: 'tournament-id', playerId: 'player-id' });
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Participant registered successfully',
        data: null,
      });
    });

    it('should return 400 when playerId is missing', async () => {
      mockRequest = { params: { id: 'tournament-id' }, body: {} };

      await controller.registerParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new MissingRequiredUserFieldsException().message,
      });
    });

    it('should return 404 when tournament is not found', async () => {
      mockRequest = { params: { id: 't-id' }, body: { playerId: 'p-id' } };
      mockService.registerParticipantInTournament.mockRejectedValue(new TournamentNotFoundException());

      await controller.registerParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentNotFoundException().message,
      });
    });

    it('should return 409 when max players exceeded', async () => {
      mockRequest = { params: { id: 't-id' }, body: { playerId: 'p-id' } };
      mockService.registerParticipantInTournament.mockRejectedValue(new TournamentMaxPlayersExceededException());

      await controller.registerParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new TournamentMaxPlayersExceededException().message,
      });
    });
  });

  describe('unregisterParticipant', () => {
    it('should return 200 when unregistered successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id', participantId: 'participant-id' },
      };

      await controller.unregisterParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockService.unregisterParticipantFromTournament).toHaveBeenCalledWith({ id: 'tournament-id', participantId: 'participant-id' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Participant unregistered successfully',
        data: null,
      });
    });

    it('should return 409 when participant is not registered', async () => {
      mockRequest = { params: { id: 't-id', participantId: 'p-id' } };
      mockService.unregisterParticipantFromTournament.mockRejectedValue(new ParticipantNotRegisteredException());

      await controller.unregisterParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new ParticipantNotRegisteredException().message,
      });
    });
  });

  describe('doCheckInParticipant', () => {
    it('should return 200 when checked in successfully', async () => {
      mockRequest = {
        params: { id: 'tournament-id', participantId: 'participant-id' },
      };

      await controller.doCheckInParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockService.doCheckInParticipant).toHaveBeenCalledWith({ id: 'tournament-id', participantId: 'participant-id' });
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'success',
        message: 'Participant checked in successfully',
        data: null,
      });
    });

    it('should return 404 when participant not found', async () => {
      mockRequest = { params: { id: 't-id', participantId: 'p-id' } };
      mockService.doCheckInParticipant.mockRejectedValue(new RegisteredParticipantNotFoundException());

      await controller.doCheckInParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: new RegisteredParticipantNotFoundException().message,
      });
    });

    it('should return 500 on generic error', async () => {
      mockRequest = { params: { id: 't-id', participantId: 'p-id' } };
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockService.doCheckInParticipant.mockRejectedValue(new Error('Unknown'));

      await controller.doCheckInParticipant(mockRequest as Request, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      consoleSpy.mockRestore();
    });
  });
});
