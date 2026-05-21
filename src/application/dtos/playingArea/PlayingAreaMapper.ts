import { PlayingArea } from "../../../domain/entities/PlayingArea.js";
import { PlayingAreaResponseDTO } from "./PlayingAreaDTOs.js";

export class PlayingAreaMapper {
    public static toResponse(playingArea: PlayingArea): PlayingAreaResponseDTO {

        return {
            id: playingArea.getId(),
            tournamentId: playingArea.getTournamentId(),
            boards: playingArea.getBoards().map(board => ({
                number: board.getNumber(),
                status: board.getStatus(),
                matchId: board.getMatchId(),
            }))
        };
    }
}
