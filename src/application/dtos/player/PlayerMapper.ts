import { Player } from '../../../domain/entities/Player.js';
import { PlayerWithUser } from '../../../domain/ports/repositories/IPlayerRepository.js';
import { PlayerResponseDTO, PlayerWithUserResponseDTO } from './PlayerDTOs.js';

export class PlayerMapper {
    public static toResponse(player: Player): PlayerResponseDTO {
        return {
            id: player.getId(),
            userId: player.getUserId(),
            registrationNumber: player.getRegistrationNumber(),
            federation: player.getFederation(),
            seasonStartYear: player.getSeason().getStartYear(),
        };
    }

    public static toResponseWithUser(playerWithUser: PlayerWithUser): PlayerWithUserResponseDTO {
        const { player, user } = playerWithUser;
        return {
            id: player.getId(),
            userId: player.getUserId(),
            registrationNumber: player.getRegistrationNumber(),
            federation: player.getFederation(),
            seasonStartYear: player.getSeason().getStartYear(),
            userAlias: user.getAlias(),
        };
    }
}
