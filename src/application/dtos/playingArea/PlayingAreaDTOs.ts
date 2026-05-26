import { BoardStatus } from "../../../domain/entities/PlayingArea.js";

export interface PlayingAreaResponseDTO {
    id: string;
    tournamentId: string;
    boards: BoardDTO[];
}

export interface BoardDTO {
    id: string;
    number: number;
    status: BoardStatus;
    matchId: string | null;
}

export interface CreatePlayingAreaRequestDTO {
    id: string; // Tournament ID
    numBoards: number;
}

export interface OccupyPlayingAreaBoardRequestDTO {
    id: string; // Playing Area ID
    boardNumber: number;
    matchId: string;
}

export interface ReleasePlayingAreaBoardRequestDTO {
    id: string; // Playing Area ID
    boardNumber: number;
}

export interface DisablePlayingAreaBoardRequestDTO {
    id: string; // Playing Area ID
    boardNumber: number;
}

export interface EnablePlayingAreaBoardRequestDTO {
    id: string; // Playing Area ID
    boardNumber: number;
}
