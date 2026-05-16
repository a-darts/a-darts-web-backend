import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { BracketResponseDTO } from '../../dtos/bracket/BracketDTOs.js';
import { BracketMapper } from '../../dtos/bracket/BracketMapper.js';

export class GetTournamentBracket {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly bracketRepository: BracketRepository,
  ) { }

  public async execute(id: string): Promise<BracketResponseDTO> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Fetch the bracket in the DB
    const bracket = await this.bracketRepository.findByTournamentId(id);
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 3. Return the tournament data
    return BracketMapper.toResponse(bracket);
  }
}
