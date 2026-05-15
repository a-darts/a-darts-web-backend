import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { BracketResponseDTO, ReshuffleBracketRequestDTO, UpdateBracketPositionsRequestDTO } from '../../dtos/bracket/BracketDTOs.js';
import { BracketMapper } from '../../dtos/bracket/BracketMapper.js';

export class ReshuffleBracket {
    constructor(private readonly bracketRepository: BracketRepository) { }

    public async execute(request: ReshuffleBracketRequestDTO): Promise<BracketResponseDTO> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(request.id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Swap the positions in the bracket
        bracket.reshuffle();

        // 3. Persist the changes in the DB
        await this.bracketRepository.update(bracket);

        // 4. Return the updated bracket data
        return BracketMapper.toResponse(bracket);
    }
}
