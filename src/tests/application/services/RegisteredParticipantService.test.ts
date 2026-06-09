import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisteredParticipantService } from '../../../application/services/RegisteredParticipantService.js';
import { RegisteredParticipant } from '../../../domain/entities/Participant.js';
import { ParticipantAlreadyRegisteredException, ParticipantNotRegisteredException, RegisteredParticipantNotFoundException } from '../../../domain/exceptions/ParticipantExceptions.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { RegistrationAlreadyClosedException } from '../../../domain/exceptions/RegistrationExceptions.js';
import { TournamentAlreadyHasBracketException, TournamentMaxPlayersExceededException, TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';

vi.mock('../../../application/dtos/registeredParticipant/RegisteredParticipantMapper.js', () => ({
  RegisteredParticipantMapper: {
    toResponse: vi.fn((p) => ({ id: p.getId() })),
  },
}));

vi.mock('../../../domain/entities/Participant.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    RegisteredParticipant: {
      create: vi.fn(),
    },
  };
});

describe('RegisteredParticipantService', () => {
  let service: RegisteredParticipantService;
  let tournamentRepositoryMock: any;
  let bracketRepositoryMock: any;
  let registeredParticipantRepositoryMock: any;
  let playerRepositoryMock: any;
  let userRepositoryMock: any;

  beforeEach(() => {
    tournamentRepositoryMock = {
      findById: vi.fn(),
    };
    bracketRepositoryMock = {
      findByTournamentId: vi.fn(),
    };
    registeredParticipantRepositoryMock = {
      findAllByTournamentId: vi.fn(),
      findByTournamentIdAndPlayerId: vi.fn(),
      countByTournamentId: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
    };
    playerRepositoryMock = {
      findByIdWithUser: vi.fn(),
    };
    userRepositoryMock = {
      findById: vi.fn(),
    };

    service = new RegisteredParticipantService(
      tournamentRepositoryMock,
      bracketRepositoryMock,
      registeredParticipantRepositoryMock,
      playerRepositoryMock,
      userRepositoryMock
    );

    vi.clearAllMocks();
  });

  const createMockTournament = (overrides = {}) => ({
    getId: vi.fn().mockReturnValue('tournament-id'),
    isRegistrationOpen: vi.fn().mockReturnValue(true),
    getSeason: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue(true) }),
    getInfo: vi.fn().mockReturnValue({ getMaxPlayers: vi.fn().mockReturnValue(10) }),
    ...overrides,
  });

  describe('getRegisteredParticipantsByTournamentId', () => {
    it('should return empty array if no participants', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue([]);

      const result = await service.getRegisteredParticipantsByTournamentId('tournament-id');

      expect(result).toEqual([]);
    });

    it('should return mapped participants', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      registeredParticipantRepositoryMock.findAllByTournamentId.mockResolvedValue([{ getId: vi.fn().mockReturnValue('p-1') }]);

      const result = await service.getRegisteredParticipantsByTournamentId('tournament-id');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p-1');
    });

    it('should throw TournamentNotFoundException if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(service.getRegisteredParticipantsByTournamentId('t')).rejects.toThrow(TournamentNotFoundException);
    });
  });

  describe('registerParticipantInTournament', () => {
    it('should register participant', async () => {
      const mockTournament = createMockTournament();
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);
      
      const mockPlayer = {
        player: { getSeason: vi.fn(), getFederation: vi.fn().mockReturnValue('FED') },
        user: { getAlias: vi.fn().mockReturnValue('alias') }
      };
      mockPlayer.player.getSeason.mockReturnValue({ equals: vi.fn().mockReturnValue(true) });
      playerRepositoryMock.findByIdWithUser.mockResolvedValue(mockPlayer);
      
      registeredParticipantRepositoryMock.findByTournamentIdAndPlayerId.mockResolvedValue(null);
      registeredParticipantRepositoryMock.countByTournamentId.mockResolvedValue(5);
      
      const newParticipant = { getId: vi.fn() };
      (RegisteredParticipant.create as any).mockReturnValue(newParticipant);

      await service.registerParticipantInTournament({ id: 'tournament-id', playerId: 'player-id' });

      expect(RegisteredParticipant.create).toHaveBeenCalledWith('player-id', 'tournament-id', 'alias', 'FED');
      expect(registeredParticipantRepositoryMock.create).toHaveBeenCalledWith(newParticipant);
    });

    it('should throw RegistrationAlreadyClosedException if closed', async () => {
      const mockTournament = createMockTournament({ isRegistrationOpen: vi.fn().mockReturnValue(false) });
      tournamentRepositoryMock.findById.mockResolvedValue(mockTournament);
      await expect(service.registerParticipantInTournament({ id: 't', playerId: 'p' })).rejects.toThrow(RegistrationAlreadyClosedException);
    });

    it('should throw TournamentAlreadyHasBracketException if bracket exists', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      bracketRepositoryMock.findByTournamentId.mockResolvedValue({});
      await expect(service.registerParticipantInTournament({ id: 't', playerId: 'p' })).rejects.toThrow(TournamentAlreadyHasBracketException);
    });

    it('should throw PlayerNotFoundException if player not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      playerRepositoryMock.findByIdWithUser.mockResolvedValue(null);
      await expect(service.registerParticipantInTournament({ id: 't', playerId: 'p' })).rejects.toThrow(PlayerNotFoundException);
    });

    it('should throw InvalidRegisteredPlayerSeasonException if seasons mismatch', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      const mockPlayer = { player: { getSeason: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue(false) }) } };
      playerRepositoryMock.findByIdWithUser.mockResolvedValue(mockPlayer);
      await expect(service.registerParticipantInTournament({ id: 't', playerId: 'p' })).rejects.toThrow(InvalidRegisteredPlayerSeasonException);
    });

    it('should throw ParticipantAlreadyRegisteredException if already registered', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      const mockPlayer = { player: { getSeason: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue(true) }) } };
      playerRepositoryMock.findByIdWithUser.mockResolvedValue(mockPlayer);
      registeredParticipantRepositoryMock.findByTournamentIdAndPlayerId.mockResolvedValue({});
      await expect(service.registerParticipantInTournament({ id: 't', playerId: 'p' })).rejects.toThrow(ParticipantAlreadyRegisteredException);
    });

    it('should throw TournamentMaxPlayersExceededException if max reached', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(createMockTournament());
      const mockPlayer = { player: { getSeason: vi.fn().mockReturnValue({ equals: vi.fn().mockReturnValue(true) }) } };
      playerRepositoryMock.findByIdWithUser.mockResolvedValue(mockPlayer);
      registeredParticipantRepositoryMock.findByTournamentIdAndPlayerId.mockResolvedValue(null);
      registeredParticipantRepositoryMock.countByTournamentId.mockResolvedValue(10);
      await expect(service.registerParticipantInTournament({ id: 't', playerId: 'p' })).rejects.toThrow(TournamentMaxPlayersExceededException);
    });
  });

  describe('unregisterParticipantFromTournament', () => {
    it('should unregister participant', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);
      registeredParticipantRepositoryMock.findById.mockResolvedValue({});

      await service.unregisterParticipantFromTournament({ id: 'tournament-id', participantId: 'participant-id' });

      expect(registeredParticipantRepositoryMock.delete).toHaveBeenCalledWith('participant-id');
    });

    it('should throw TournamentNotFoundException if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(service.unregisterParticipantFromTournament({ id: 't', participantId: 'p' })).rejects.toThrow(TournamentNotFoundException);
    });

    it('should throw TournamentAlreadyHasBracketException if bracket exists', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      bracketRepositoryMock.findByTournamentId.mockResolvedValue({});
      await expect(service.unregisterParticipantFromTournament({ id: 't', participantId: 'p' })).rejects.toThrow(TournamentAlreadyHasBracketException);
    });

    it('should throw ParticipantNotRegisteredException if participant not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      bracketRepositoryMock.findByTournamentId.mockResolvedValue(null);
      registeredParticipantRepositoryMock.findById.mockResolvedValue(null);
      await expect(service.unregisterParticipantFromTournament({ id: 't', participantId: 'p' })).rejects.toThrow(ParticipantNotRegisteredException);
    });
  });

  describe('doCheckInParticipant', () => {
    it('should check in participant', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      const participant = { getPlayerId: vi.fn().mockReturnValue('p-1'), doCheckIn: vi.fn() };
      registeredParticipantRepositoryMock.findById.mockResolvedValue(participant);
      registeredParticipantRepositoryMock.findByTournamentIdAndPlayerId.mockResolvedValue({});

      await service.doCheckInParticipant({ id: 'tournament-id', participantId: 'participant-id' });

      expect(participant.doCheckIn).toHaveBeenCalled();
      expect(registeredParticipantRepositoryMock.update).toHaveBeenCalledWith(participant);
    });

    it('should throw TournamentNotFoundException if not found', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue(null);
      await expect(service.doCheckInParticipant({ id: 't', participantId: 'p' })).rejects.toThrow(TournamentNotFoundException);
    });

    it('should throw RegisteredParticipantNotFoundException if not found by id', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      registeredParticipantRepositoryMock.findById.mockResolvedValue(null);
      await expect(service.doCheckInParticipant({ id: 't', participantId: 'p' })).rejects.toThrow(RegisteredParticipantNotFoundException);
    });

    it('should throw RegisteredParticipantNotFoundException if not found by tournament and player', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      const participant = { getPlayerId: vi.fn().mockReturnValue('p-1') };
      registeredParticipantRepositoryMock.findById.mockResolvedValue(participant);
      registeredParticipantRepositoryMock.findByTournamentIdAndPlayerId.mockResolvedValue(null);
      await expect(service.doCheckInParticipant({ id: 't', participantId: 'p' })).rejects.toThrow(RegisteredParticipantNotFoundException);
    });
  });

  describe('undoCheckInParticipant', () => {
    it('should undo check in participant', async () => {
      tournamentRepositoryMock.findById.mockResolvedValue({});
      const participant = { getPlayerId: vi.fn().mockReturnValue('p-1'), undoCheckIn: vi.fn() };
      registeredParticipantRepositoryMock.findById.mockResolvedValue(participant);
      registeredParticipantRepositoryMock.findByTournamentIdAndPlayerId.mockResolvedValue({});

      await service.undoCheckInParticipant({ id: 'tournament-id', participantId: 'participant-id' });

      expect(participant.undoCheckIn).toHaveBeenCalled();
      expect(registeredParticipantRepositoryMock.update).toHaveBeenCalledWith(participant);
    });
  });
});
