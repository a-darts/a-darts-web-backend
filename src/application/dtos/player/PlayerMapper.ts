import { Player } from '../../../domain/entities/Player.js';
import { PlayerResponseDto } from './PlayerDTOs.js';

export class PlayerMapper {
    public static toResponse(player: Player): PlayerResponseDto {
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
