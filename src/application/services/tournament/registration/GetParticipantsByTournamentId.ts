import { PlayerNotFoundException } from '../../../../domain/exceptions/PlayerExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { PlayerRepository } from '../../../../domain/repositories/PlayerRepository.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { UserRepository } from '../../../../domain/repositories/UserRepository.js';
import { RegisteredParticipantsNameFederationDTO } from '../../../dtos/tournament/registeredParticipant/RegisteredParticipantDTOs.js';
import { RegisteredParticipantMapper } from '../../../dtos/tournament/registeredParticipant/RegisteredParticipantMapper.js';

export class GetParticipantsByTournamentId {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly registeredParticipantRepository: RegisteredParticipantRepository,
    private readonly playerRepository: PlayerRepository,
    private readonly userRepository: UserRepository,
  ) { }

  public async execute(id: string): Promise<RegisteredParticipantsNameFederationDTO[]> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Fetch the tournament participants in the DB
    const participants = await this.registeredParticipantRepository.findAllByTournamentId(id);
    if (!participants || participants.length === 0) {
      return [];
    }

    // 3. Map everything together
    return participants.map(p => RegisteredParticipantMapper.toResponse(p));
  }
}
