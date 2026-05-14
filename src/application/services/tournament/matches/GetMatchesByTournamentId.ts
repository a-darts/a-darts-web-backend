import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { MatchResponseDTO } from '../../../dtos/tournament/match/MatchDTOs.js';
import { MatchMapper } from '../../../dtos/tournament/match/MatchMapper.js';
import { RegisteredParticipantMapper } from '../../../dtos/tournament/registeredParticipant/RegisteredParticipantMapper.js';

export class GetMatchesByTournamentId {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly matchRepository: MatchRepository,
    private readonly registeredParticipantRepository: RegisteredParticipantRepository,
  ) { }

  public async execute(id: string): Promise<MatchResponseDTO[]> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Fetch the matches in the DB
    const matches = await this.matchRepository.findManyByTournamentId(id);
    if (!matches) {
      return [];
    }

    // 4. Return the matches data
    // MIRAR CAMBIAR
    return matches.map(data => {
      // Rehidratamos los participantes desde la data anidada
      const p1 = RegisteredParticipantMapper.toResponse(data.participant1);
      const p2 = RegisteredParticipantMapper.toResponse(data.participant2);

      return MatchMapper.toResponse(data, data.participant1, data.participant2);
    });
    // return Promise.all(
    //   matches.map(async (match) => {
    //     const [p1, p2] = await Promise.all([
    //       this.registeredParticipantRepository.findById(match.getParticipant1Id()),
    //       this.registeredParticipantRepository.findById(match.getParticipant2Id()),
    //     ]);

    //     return MatchMapper.toResponse(match, p1, p2);
    //   })
    // );
  }
}
