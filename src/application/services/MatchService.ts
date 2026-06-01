import { Board } from '../../domain/entities/PlayingArea.js';
import {
  MatchBoardNumberRequiredException,
  MatchNotAssignedToBoardException,
  MatchNotFoundException,
} from "../../domain/exceptions/MatchExceptions.js";
import { TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { PlayingAreaNotFoundException } from '../../domain/exceptions/PlayingAreaExceptions.js';
import { BracketNotFoundException } from "../../domain/exceptions/BracketExceptions.js";

import { IBracketRepository } from "../../domain/repositories/IBracketRepository.js";
import { IMatchRepository } from "../../domain/repositories/IMatchRepository.js";
import { IPlayingAreaRepository } from "../../domain/repositories/IPlayingAreaRepository.js";
import { ITournamentRepository } from "../../domain/repositories/ITournamentRepository.js";
import { IMatchCacheRepository } from "../../domain/repositories/IMatchCacheRepository.js";

import { SingleEliminationMatchGenerator } from "../../domain/services/SingleEliminationMatchGenerator.js";
import { UnitOfWork } from "../../domain/repositories/UnitOfWork.js";
import { EventBus } from "../../domain/events/EventBus.js";
import { MatchResumedEvent, MatchSuspendedEvent } from '../../domain/events/MatchEvents.js';

import { getSocketServer } from '../../infrastructure/websockets/SocketServer.js';

import {
  MatchResponseDTO,
  UpdateMatchScoreRequestDTO,
  SetMatchBoardNumberRequestDTO,
  SetMatchResultRequestDTO,
} from "../dtos/tournament/match/MatchDTOs.js";
import { MatchMapper } from "../dtos/tournament/match/MatchMapper.js";
import { MatchStatus } from '../../domain/entities/Match.js';


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

    // 6. Notify the old board about the unassignment
    if (oldBoard) {
      const oldBoardShortId = oldBoard.getShortId();
      await this.matchCacheRepository.clearBoardActiveMatch(oldBoardShortId);

      console.log(`[ReleasePlayingAreaBoard] Match unassigned from board. Sending match_unassigned to room_board_${oldBoardShortId}`);
      const oldRoomName = `room_board_${oldBoardShortId}`;
      getSocketServer().to(oldRoomName).emit('match_unassigned', { matchId: request.id });
    }

    // 7. Notify the board about the new match assignment
    const newBoardShortId = newBoard.getShortId();
    await this.matchCacheRepository.setActiveMatchForBoard(newBoardShortId, request.id);

    const status = await this.matchCacheRepository.getMatchStatus(request.id);
    const historyThrows = await this.matchCacheRepository.getThrows(request.id);

    const newRoomName = `room_board_${newBoardShortId}`;

    if (status === 'IN_PROGRESS' && historyThrows && historyThrows.length > 0) {
      console.log(`[SetMatchBoardNumber] Match already in progress. Sending match_restored to ${newRoomName}`);

      // Enviamos match_restored a toda la sala para que la tablet se auto-configure en caliente
      getSocketServer().to(newRoomName).emit('match_restored', {
        matchId: request.id,
        historyThrows: historyThrows
      });
    } else {
      // Enviamos match_assigned a toda la sala
      console.log(`[SetMatchBoardNumber] Match assigned to board. Sending match_assigned to ${newRoomName}`);
      getSocketServer().to(newRoomName).emit('match_assigned', { matchId: request.id });
    }
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

    // 2. Cancel the match
    match.cancel();

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 4. Save the match status in Redis
    await this.matchCacheRepository.setMatchStatus(id, MatchStatus.CANCELLED);
  }
}