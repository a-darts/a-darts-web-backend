import { BoardStatus } from "../../../domain/entities/PlayingArea.js";

export interface PlayingAreaResponseDTO {
    id: string;
    tournamentId: string;
    boards: BoardDTO[];
}

export interface BoardDTO {
    number: number;
    status: BoardStatus;
    matchId: string | null;
}
