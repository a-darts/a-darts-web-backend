import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentService } from '../../../application/services/TournamentService.js';
import { TournamentStatus } from '../../../domain/entities/Tournament.js';

describe('TournamentService - processRegistrationPeriods', () => {
  let tournamentService: TournamentService;
  let tournamentRepositoryMock: any;

  beforeEach(() => {
    tournamentRepositoryMock = {
      findAll: vi.fn(),
      update: vi.fn(),
    };

    const dummyRepo = {} as any;
    tournamentService = new TournamentService(
      tournamentRepositoryMock,
      dummyRepo, // bracket
      dummyRepo, // registeredParticipant
      dummyRepo, // playingArea
      dummyRepo, // tournamentResult
      dummyRepo, // match
      dummyRepo, // matchGenerator
      dummyRepo, // eventBus
      dummyRepo  // unitOfWork
    );
  });

  const createMockTournament = (
    status: TournamentStatus,
    hasSchedule: boolean,
    periodShouldBeOpen: boolean,
    registrationIsClosed: boolean,
    registrationIsOpen: boolean
  ) => {
    return {
      getId: vi.fn().mockReturnValue('tournament-id'),
      getName: vi.fn().mockReturnValue('Tournament Name'),
      getStatus: vi.fn().mockReturnValue(status),
      getRegistration: vi.fn().mockReturnValue({
        getRegistrationPeriod: vi.fn().mockReturnValue({
          hasSchedule: vi.fn().mockReturnValue(hasSchedule),
          isOpen: vi.fn().mockReturnValue(periodShouldBeOpen),
        }),
        isClosed: vi.fn().mockReturnValue(registrationIsClosed),
        isOpen: vi.fn().mockReturnValue(registrationIsOpen),
      }),
      openRegistration: vi.fn(),
      closeRegistration: vi.fn(),
    };
  };

  it('should do nothing if tournament is not PUBLISHED', async () => {
    const mockTournament = createMockTournament(TournamentStatus.DRAFT, true, true, true, false);
    tournamentRepositoryMock.findAll.mockResolvedValue([mockTournament]);

    await tournamentService.processRegistrationPeriods();

    expect(mockTournament.openRegistration).not.toHaveBeenCalled();
    expect(mockTournament.closeRegistration).not.toHaveBeenCalled();
    expect(tournamentRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('should do nothing if period has no schedule', async () => {
    const mockTournament = createMockTournament(TournamentStatus.PUBLISHED, false, true, true, false);
    tournamentRepositoryMock.findAll.mockResolvedValue([mockTournament]);

    await tournamentService.processRegistrationPeriods();

    expect(mockTournament.openRegistration).not.toHaveBeenCalled();
    expect(mockTournament.closeRegistration).not.toHaveBeenCalled();
    expect(tournamentRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('should open registration if period should be open and registration is closed', async () => {
    const mockTournament = createMockTournament(TournamentStatus.PUBLISHED, true, true, true, false);
    tournamentRepositoryMock.findAll.mockResolvedValue([mockTournament]);

    await tournamentService.processRegistrationPeriods();

    expect(mockTournament.openRegistration).toHaveBeenCalled();
    expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockTournament);
    expect(mockTournament.closeRegistration).not.toHaveBeenCalled();
  });

  it('should close registration if period should not be open and registration is open', async () => {
    const mockTournament = createMockTournament(TournamentStatus.PUBLISHED, true, false, false, true);
    tournamentRepositoryMock.findAll.mockResolvedValue([mockTournament]);

    await tournamentService.processRegistrationPeriods();

    expect(mockTournament.closeRegistration).toHaveBeenCalled();
    expect(tournamentRepositoryMock.update).toHaveBeenCalledWith(mockTournament);
    expect(mockTournament.openRegistration).not.toHaveBeenCalled();
  });

  it('should do nothing if period should be open and registration is already open', async () => {
    const mockTournament = createMockTournament(TournamentStatus.PUBLISHED, true, true, false, true);
    tournamentRepositoryMock.findAll.mockResolvedValue([mockTournament]);

    await tournamentService.processRegistrationPeriods();

    expect(mockTournament.openRegistration).not.toHaveBeenCalled();
    expect(mockTournament.closeRegistration).not.toHaveBeenCalled();
    expect(tournamentRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('should do nothing if period should not be open and registration is already closed', async () => {
    const mockTournament = createMockTournament(TournamentStatus.PUBLISHED, true, false, true, false);
    tournamentRepositoryMock.findAll.mockResolvedValue([mockTournament]);

    await tournamentService.processRegistrationPeriods();

    expect(mockTournament.openRegistration).not.toHaveBeenCalled();
    expect(mockTournament.closeRegistration).not.toHaveBeenCalled();
    expect(tournamentRepositoryMock.update).not.toHaveBeenCalled();
  });

  it('should handle repository errors gracefully', async () => {
    tournamentRepositoryMock.findAll.mockRejectedValue(new Error('DB Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(tournamentService.processRegistrationPeriods()).resolves.not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith('[RegistrationScheduler] Error processing registration periods:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
