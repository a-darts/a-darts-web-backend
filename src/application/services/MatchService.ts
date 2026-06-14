import { Board } from '../../domain/entities/PlayingArea.js';
import {
  MatchBoardNumberRequiredException,
  MatchNotAssignedToBoardException,
  MatchNotFoundException,
} from "../../domain/exceptions/MatchExceptions.js";
import { TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { PlayingAreaNotFoundException } from '../../domain/exceptions/PlayingAreaExceptions.js';
import { BracketNotFoundException } from "../../domain/exceptions/BracketExceptions.js";

import { IBracketRepository } from "../../domain/ports/repositories/IBracketRepository.js";
import { IMatchRepository } from "../../domain/ports/repositories/IMatchRepository.js";
import { IPlayingAreaRepository } from "../../domain/ports/repositories/IPlayingAreaRepository.js";
import { ITournamentRepository } from "../../domain/ports/repositories/ITournamentRepository.js";
import { IMatchCacheRepository } from "../../domain/ports/repositories/IMatchCacheRepository.js";

import { SingleEliminationMatchGenerator } from "../../domain/services/SingleEliminationMatchGenerator.js";
import { UnitOfWork } from "../../domain/ports/services/UnitOfWork.js";
import { EventBus } from "../../domain/events/EventBus.js";

import { getSocketServer } from '../../infrastructure/websockets/SocketServer.js';

import {
  MatchResponseDTO,
  UpdateMatchScoreRequestDTO,
  SetMatchBoardNumberRequestDTO,
  SetMatchResultRequestDTO,
} from "../dtos/match/MatchDTOs.js";
import { MatchMapper } from "../dtos/match/MatchMapper.js";
import { MatchStatus } from '../../domain/entities/Match.js';
import { MatchAssignedToBoardEvent, MatchCancelledEvent, MatchResumedEvent, MatchSuspendedEvent, MatchUnassignedFromBoardEvent } from '../../domain/events/MatchEvents.js';
import { IDomainEvent } from '../../domain/events/IDomainEvent.js';


export class MatchService {
  constructor(
    private readonly matchRepository: IMatchRepository,
    private readonly bracketRepository: IBracketRepository,
    private readonly tournamentRepository: ITournamentRepository,
    private readonly playingAreaRepository: IPlayingAreaRepository,
    private readonly matchCacheRepository: IMatchCacheRepository,
    private readonly matchGenerator: SingleEliminationMatchGenerator,
    private readonly eventBus: EventBus,
    private readonly unitOfWork: UnitOfWork,
  ) { }


  public async getById(id: string): Promise<MatchResponseDTO> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findByIdWithParticipants(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Return the match data
    return MatchMapper.toResponse(match);
  }


  public async getAllByTournamentId(id: string): Promise<MatchResponseDTO[]> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Fetch the matches in the DB
    const matches = await this.matchRepository.findManyByTournamentIdWithParticipants(id);
    if (!matches) {
      return [];
    }

    // 4. Return the matches data
    return matches.map(match => {
      return MatchMapper.toResponse(match);
    });
  }


  public async updateScore(request: UpdateMatchScoreRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Update the match result
    match.setScore(
      request.participant1Sets,
      request.participant1Legs,
      request.participant2Sets,
      request.participant2Legs,
    );

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);
  }


  public async setBoardNumber(request: SetMatchBoardNumberRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 3. Check if the match was previously assigned to a board
    let oldBoard: Board | null = null;
    try {
      oldBoard = playingArea.findBoardByMatchId(request.id);
    } catch (error) {
      // The match was not previously assigned to any board (ignore error)
    }

    // 4. Release the old board if assigned
    if (oldBoard) {
      playingArea.releaseBoard(oldBoard);
    }

    // 5. Assign the match to the new board
    const newBoard = playingArea.findBoardByNumber(request.boardNumber);
    playingArea.assignMatchToBoard(request.id, newBoard);

    // 5. Persist the changes in the DB
    await this.playingAreaRepository.update(playingArea);

    // 6. Publish events in the eventBus
    let allEvents: IDomainEvent[] = [
      new MatchAssignedToBoardEvent(request.id, newBoard.getShortId()),
    ];
    if (oldBoard) {
      allEvents = [
        ...allEvents,
        new MatchUnassignedFromBoardEvent(request.id, oldBoard.getShortId()),
      ];
    }
    this.eventBus.publish(allEvents);
  }


  public async setResultAndPromote(request: SetMatchResultRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(match.getTournamentId());
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 3. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 4. Set final score and finish the match
    match.setScore(
      request.participant1Sets,
      request.participant1Legs,
      request.participant2Sets,
      request.participant2Legs,
    );

    match.finish();

    const board = playingArea.findBoardByMatchId(request.id);
    playingArea.releaseBoard(board);

    // 5. Obtain the winner
    const winnerId = match.getWinnerId();
    let nextMatch = null;

    // 6. Si no era la final, promocionamos al ganador a la siguiente partida
    if (winnerId) {
      const nextCoords = this.matchGenerator.getNextMatchCoordinates(
        match.getRound(),
        match.getMatchIndex(),
        bracket.getPositions().length,
      );

      if (nextCoords) {
        nextMatch = await this.matchRepository.findByTournamentRoundAndMatchIndex(
          match.getTournamentId(),
          nextCoords.round,
          nextCoords.matchIndex,
        );
        if (nextMatch) {
          nextMatch.promoteWinner(winnerId, nextCoords.slot);
        }
      } else {
        bracket.finish();
      }
    }

    // 7. Persist the next match changes and bracket status
    await this.unitOfWork.transaction(async () => {
      await this.bracketRepository.update(bracket);
      await this.matchRepository.update(match);
      if (nextMatch) {
        await this.matchRepository.update(nextMatch);
      }
      await this.playingAreaRepository.update(playingArea);
    });

    // 8. Publish events
    const bracketEvents = bracket.pullEvents();
    const matchEvents = match.pullEvents();
    const nextMatchEvents = nextMatch ? nextMatch.pullEvents() : [];

    const allEvents = [...bracketEvents, ...matchEvents, ...nextMatchEvents];
    if (allEvents.length > 0) {
      await this.eventBus.publish(allEvents);
    }
  }


  public async start(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 3. Check if the match is assigned to a board
    try {
      playingArea.findBoardByMatchId(id);
    } catch (error) {
      throw new MatchNotAssignedToBoardException();
    }

    // 4. Start the match
    match.start();

    // 5. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 6. Notify the board via socket
    try {
      const boardShortId = await playingArea.findBoardByMatchId(id).getShortId();
      console.log(`[OccupyPlayingAreaBoard] Sending match_assigned to room_board_${boardShortId} with matchId: ${id}`);
      const roomName = `room_board_${boardShortId}`;
      console.log(`[StartMatch] Sending match_started_confirmed to ${roomName} with matchId: ${id}`);
      getSocketServer().to(roomName).emit('match_started_confirmed', { matchId: id });
    } catch (error) {
      console.log("Error while fetching the match board in the playing area");
    }

    // 7. Save the match status in Redis
    await this.matchCacheRepository.setMatchStatus(id, MatchStatus.IN_PROGRESS);
  }


  public async finish(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(match.getTournamentId());
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 3. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 4. Finish the match
    match.finish();

    // 5. Release the board if it was assigned
    const board = playingArea.findBoardByMatchId(id);
    playingArea.releaseBoard(board);

    // 6. Obtain the winner
    const winnerId = match.getWinnerId();
    let nextMatch = null;

    // 7. Si no era la final, promocionamos al ganador a la siguiente partida
    if (winnerId) {
      const nextCoords = this.matchGenerator.getNextMatchCoordinates(
        match.getRound(),
        match.getMatchIndex(),
        bracket.getPositions().length,
      );

      if (nextCoords) {
        nextMatch = await this.matchRepository.findByTournamentRoundAndMatchIndex(
          match.getTournamentId(),
          nextCoords.round,
          nextCoords.matchIndex,
        );
        if (nextMatch) {
          nextMatch.promoteWinner(winnerId, nextCoords.slot);
        }
      } else {
        bracket.finish();
      }
    }

    // 8. Persist the next match changes and bracket status
    await this.unitOfWork.transaction(async () => {
      await this.bracketRepository.update(bracket);
      await this.matchRepository.update(match);
      if (nextMatch) {
        await this.matchRepository.update(nextMatch);
      }
      await this.playingAreaRepository.update(playingArea);
    });

    // 9. Publish events
    const bracketEvents = bracket.pullEvents();
    const matchEvents = match.pullEvents();
    const nextMatchEvents = nextMatch ? nextMatch.pullEvents() : [];

    const allEvents = [...bracketEvents, ...matchEvents, ...nextMatchEvents];
    if (allEvents.length > 0) {
      await this.eventBus.publish(allEvents);
    }
  }


  public async suspend(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Get the boardShortId
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }
    const boardShortId = playingArea.findBoardByMatchId(id).getShortId();

    // 3. Suspend the match
    match.suspend();

    // 4. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 5. Save the match status in Redis
    await this.matchCacheRepository.setMatchStatus(id, MatchStatus.SUSPENDED);

    // 6. Publish the event
    this.eventBus.publish([
      new MatchSuspendedEvent(id, boardShortId),
    ]);
  }


  public async resume(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Get the boardShortId
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }
    const boardShortId = playingArea.findBoardByMatchId(id).getShortId();

    // 3. Resume the match
    match.resume();

    // 4. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 5. Save the match status in Redis
    await this.matchCacheRepository.setMatchStatus(id, MatchStatus.IN_PROGRESS);

    // 6. Publish the event
    this.eventBus.publish([
      new MatchResumedEvent(id, boardShortId),
    ]);
  }


  public async cancel(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Get the boardShortId
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }
    const boardShortId = playingArea.findBoardByMatchId(id).getShortId();

    // 3. Release the board if it was assigned
    if (boardShortId) {
      try {
        const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
        if (playingArea) {
          const board = playingArea.findBoardByMatchId(id);
          playingArea.releaseBoard(board);
          await this.playingAreaRepository.update(playingArea);
        }
      } catch (e) { }
    }

    // 4. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 5. Save the match status in Redis
    await this.matchCacheRepository.setMatchStatus(id, MatchStatus.CANCELLED);

    // 6. Publish the event
    this.eventBus.publish([
      new MatchCancelledEvent(id, boardShortId),
    ]);
  }
}
