import { Player } from '../../../domain/entities/Player.js';
import { PlayerResponseDTO } from './PlayerDTOs.js';

export class PlayerMapper {
    public static toResponse(player: Player): PlayerResponseDTO {
        return {
            id: player.getId(),
            userId: player.getUserId(),
            registrationNumber: player.getRegistrationNumber(),
            federation: player.getFederation(),
            seasonStartYear: player.getSeason().getStartYear(),
            seasonEndYear: player.getSeason().getEndYear(),
        };
    }
}
