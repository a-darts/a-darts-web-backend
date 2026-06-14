import { PlayingArea } from "../../domain/entities/PlayingArea.js";
import { BoardPairedWithTabletException, PlayingAreaAlreadyExistsException, PlayingAreaNotFoundException } from "../../domain/exceptions/PlayingAreaExceptions.js";
import { TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { IMatchCacheRepository } from "../../domain/ports/repositories/IMatchCacheRepository.js";
import { IPlayingAreaRepository } from "../../domain/ports/repositories/IPlayingAreaRepository.js";
import { ITournamentRepository } from "../../domain/ports/repositories/ITournamentRepository.js";
import { CreatePlayingAreaRequestDTO, DisablePlayingAreaBoardRequestDTO, EnablePlayingAreaBoardRequestDTO, PlayingAreaResponseDTO, ReleasePlayingAreaBoardRequestDTO } from "../dtos/playingArea/PlayingAreaDTOs.js";
import { PlayingAreaMapper } from "../dtos/playingArea/PlayingAreaMapper.js";


export class PlayingAreaService {
  constructor(
    private readonly playingAreaRepository: IPlayingAreaRepository,
    private readonly tournamentRepository: ITournamentRepository,
    private readonly matchCacheRepository: IMatchCacheRepository,
  ) { }


  public async getByTournamentId(id: string): Promise<PlayingAreaResponseDTO> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Fetch the playing area in the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(id);
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 3. Return the tournament data
    return PlayingAreaMapper.toResponse(playingArea);
  }


  public async create(request: CreatePlayingAreaRequestDTO): Promise<PlayingAreaResponseDTO> {
    // 1. Rehydrate the tournament object
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Check the player area not exists yet
    const existingPlayingArea = await this.playingAreaRepository.findByTournamentId(request.id);
    if (existingPlayingArea) {
      throw new PlayingAreaAlreadyExistsException();
    }

    // 3. Create the playing area
    const playingArea = PlayingArea.create(request.id, request.numBoards);

    // 4. Persist the playing area in the DB
    await this.playingAreaRepository.create(playingArea);

    // 5. Return the playing area data
    return PlayingAreaMapper.toResponse(playingArea);
  }


  public async addBoard(id: string): Promise<void> {
    // 1. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findById(id);
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 2. Add a new board in the playing area
    playingArea.addBoard();

    // 3. Persist the changes in the DB
    await this.playingAreaRepository.update(playingArea);
  }


  public async removeLastBoard(id: string): Promise<void> {
    // 1. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findById(id);
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    const boards = playingArea.getBoards();
    if (boards.length === 0) {
      playingArea.removeLastBoard();
      return;
    }

    const lastBoard = boards[boards.length - 1];

    const hasTabletConnected = await this.matchCacheRepository.hasBoardActiveSession(lastBoard.getId());
    if (hasTabletConnected) {
      throw new BoardPairedWithTabletException();
    }

    playingArea.removeLastBoard();
    await this.playingAreaRepository.update(playingArea);
  }


  public async enableBoard(request: EnablePlayingAreaBoardRequestDTO): Promise<void> {
    // 1. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findById(request.id);
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 2. Enable the board in the playing area
    const board = playingArea.findBoardById(request.boardId);
    playingArea.enableBoard(board);

    // 3. Persist the changes in the DB
    await this.playingAreaRepository.update(playingArea);
  }


  public async disableBoard(request: DisablePlayingAreaBoardRequestDTO): Promise<void> {
    // 1. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findById(request.id);
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 2. Disable the board in the playing area
    const board = playingArea.findBoardById(request.boardId);
    playingArea.disableBoard(board);

    // 3. Persist the changes in the DB
    await this.playingAreaRepository.update(playingArea);
  }


  public async releaseBoard(request: ReleasePlayingAreaBoardRequestDTO): Promise<void> {
    // 1. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findById(request.id);
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 2. Release the board in the playing area
    const board = playingArea.findBoardById(request.boardId);
    playingArea.releaseBoard(board);

    // 3. Persist the changes in the DB
    await this.playingAreaRepository.update(playingArea);
  }
}
