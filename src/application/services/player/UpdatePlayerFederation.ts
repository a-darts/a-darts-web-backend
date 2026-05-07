import { PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { UpdatePlayerFederationRequestDTO } from '../../dtos/player/PlayerDTOs.js';

export class UpdatePlayerFederation {
  constructor(private readonly playerRepository: PlayerRepository) { }

  public async execute(request: UpdatePlayerFederationRequestDTO): Promise<void> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findById(request.id);
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Update the federation in the player object
    player.updateFederation(request.newFederation);

    // 3. Persist the changes in the DB
    await this.playerRepository.update(player);
  }
}
