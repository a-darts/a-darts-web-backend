import { MatchStatus } from "../../domain/entities/Match.js";
import { Season } from "../../domain/entities/Season.js";
import { Tournament, TournamentStatus } from "../../domain/entities/Tournament.js";
import { TournamentInfo } from "../../domain/entities/TournamentInfo.js";
import { BracketNotFoundException, BracketUnfinishedException } from "../../domain/exceptions/BracketExceptions.js";
import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { IBracketRepository } from "../../domain/repositories/IBracketRepository.js";
import { IMatchRepository } from "../../domain/repositories/IMatchRepository.js";
import { IRegisteredParticipantRepository } from "../../domain/repositories/IRegisteredParticipantRepository.js";
import { ITournamentRepository } from "../../domain/repositories/ITournamentRepository.js";
import { UnitOfWork } from "../../domain/repositories/UnitOfWork.js";
import { SingleEliminationMatchGenerator } from "../../domain/services/SingleEliminationMatchGenerator.js";
import {
  CreateTournamentRequestDTO,
  TournamentResponseDTO,
  UpdateTournamentInfoRequestDTO,
  UpdateTournamentNameRequestDTO,
  UpdateTournamentRegistrationPeriodRequestDTO,
} from "../dtos/tournament/TournamentDTOs.js";
import { TournamentMapper } from "../dtos/tournament/TournamentMapper.js";


export class TournamentService {
  constructor(
    private readonly tournamentRepository: ITournamentRepository,
    private readonly bracketRepository: IBracketRepository,
    private readonly registeredParticipantRepository: IRegisteredParticipantRepository,
    private readonly matchRepository: IMatchRepository,
    private readonly matchGenerator: SingleEliminationMatchGenerator,
    private readonly unitOfWork: UnitOfWork,
  ) { }

  // --------------------------------------------------------------------
  // TOURNAMENT METHODS
  // --------------------------------------------------------------------
  public async getAll(): Promise<TournamentResponseDTO[]> {
    // 1. Rehydrate all tournaments from the DB
    const tournaments = await this.tournamentRepository.findAll();

    // 2. Return the tournaments data
    return tournaments.map(tournament => TournamentMapper.toResponse(tournament));
  }


  public async getById(id: string): Promise<TournamentResponseDTO> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Return the tournament data
    return TournamentMapper.toResponse(tournament);
  }


  public async create(request: CreateTournamentRequestDTO): Promise<TournamentResponseDTO> {

    // 3. Create the tournament (with the factory method)
    const tournament = Tournament.create(
      request.name,
      new Season(request.seasonStartYear),
      new TournamentInfo(
        request.info.place,
        request.info.dateTime,
        request.info.mode,
        request.info.game,
        request.info.schedule,
        request.info.maxPlayers,
        request.info.gameType,
        request.info.numLegs,
        request.info.numSets,
        request.info.rules,
        request.info.info,
        request.info.federation,
      ),
      request.userId,
    );

    // 4. Persist the tournament in the DB
    await this.tournamentRepository.create(tournament);

    // 5. Return the tournament data
    return TournamentMapper.toResponse(tournament);
  }


  public async updateName(request: UpdateTournamentNameRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Update the name in the tournament object
    tournament.updateName(request.newName);

    // 3. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }


  public async start(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(id);
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 2.5. Check that all bracket positions are occupied by real participants
    const realParticipantsInBracket = bracket
      .getPositions()
      .filter((position) => !position.isBye() && !position.isEmpty()).length;

    const registeredParticipantsInTournament = await this.registeredParticipantRepository.countByTournamentId(id);

    if (realParticipantsInBracket !== registeredParticipantsInTournament) {
      throw new BracketUnfinishedException();
    }

    // 3. Start the tournament, the bracket and generate the initial matches
    tournament.start();
    bracket.start();

    const initialMatches = this.matchGenerator.generateMatches(
      bracket.getTournamentId(),
      bracket.getPositions(),
    );

    // 4. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.tournamentRepository.update(tournament);
      await this.bracketRepository.update(bracket);
      for (const match of initialMatches) {
        await this.matchRepository.create(match);
      }
    });
  }


  public async cancel(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(id);

    // 3. Rehydrate all the tournament matches from the DB
    const matches = await this.matchRepository.findManyByTournamentId(id);

    // 4. Cancel the tournament, the bracket and all not FINISHED matches
    tournament.cancel();
    if (bracket) {
      bracket.cancel();
    }
    const matchesToUpdate = matches.filter(m => m.getStatus() !== MatchStatus.FINISHED);
    for (const match of matchesToUpdate) {
      match.cancel();
    }

    // 5. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.tournamentRepository.update(tournament);
      if (bracket) {
        await this.bracketRepository.update(bracket);
      }
      for (const match of matchesToUpdate) {
        await this.matchRepository.update(match);
      }
    });
  }


  public async publish(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Update the status in the tournament and bracket
    tournament.publish();

    // 4. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }


  public async unpublish(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(id);

    // 3. Update the status in the tournament and bracket
    tournament.unpublish();
    if (bracket && bracket.isPublished()) {
      bracket.unpublish();
    }

    // 4. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.tournamentRepository.update(tournament);
      if (bracket) {
        await this.bracketRepository.update(bracket);
      }
    });
  }


  // --------------------------------------------------------------------
  // TOURNAMENT INFO METHODS
  // --------------------------------------------------------------------

  public async updateInfo(request: UpdateTournamentInfoRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Update the info in the tournament object
    const newInfo = new TournamentInfo(
      request.newInfo.place,
      request.newInfo.dateTime,
      request.newInfo.mode,
      request.newInfo.game,
      request.newInfo.schedule,
      request.newInfo.maxPlayers,
      request.newInfo.gameType,
      request.newInfo.numLegs,
      request.newInfo.numSets,
      request.newInfo.rules,
      request.newInfo.info,
      request.newInfo.federation,
    );
    tournament.updateInfo(newInfo);

    // 3. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }


  // --------------------------------------------------------------------
  // REGISTRATION METHODS
  // --------------------------------------------------------------------

  public async openRegistration(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Check the tournament does not have a bracket
    const bracket = await this.bracketRepository.findByTournamentId(id);
    if (bracket) {
      throw new TournamentAlreadyHasBracketException();
    }

    // 3. Open the registration in the tournament object
    tournament.openRegistration();

    // 4. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }


  public async closeRegistration(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Open the registration in the tournament object
    tournament.closeRegistration();

    // 3. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }


  public async updateRegistrationPeriod(request: UpdateTournamentRegistrationPeriodRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Check the tournament does not have a bracket
    const bracket = await this.bracketRepository.findByTournamentId(request.id);
    if (bracket) {
      throw new TournamentAlreadyHasBracketException();
    }

    // 3. Update the registration period in the tournament object
    tournament.scheduleRegistration(
      request.newRegistrationPeriod.startsAt,
      request.newRegistrationPeriod.endsAt,
    );

    // 4. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }


  public async processRegistrationPeriods(): Promise<void> {
    try {
      const tournaments = await this.tournamentRepository.findAll();
      const publishedTournaments = tournaments.filter(t => t.getStatus() === TournamentStatus.PUBLISHED);

      for (const tournament of publishedTournaments) {
        const registration = tournament.getRegistration();
        const period = registration.getRegistrationPeriod();

        // If period is open but registration is closed, open it
        if (period.isOpen() && registration.isClosed()) {
          tournament.openRegistration();
          await this.tournamentRepository.update(tournament);
          console.log(`[RegistrationScheduler] Opened registration for tournament ${tournament.getId()} (${tournament.getName()})`);
        }

        // If period is closed but registration is open, close it
        if (period.isClosed() && registration.isOpen()) {
          tournament.closeRegistration();
          await this.tournamentRepository.update(tournament);
          console.log(`[RegistrationScheduler] Closed registration for tournament ${tournament.getId()} (${tournament.getName()})`);
        }
      }
    } catch (error) {
      console.error('[RegistrationScheduler] Error processing registration periods:', error);
    }
  }
}