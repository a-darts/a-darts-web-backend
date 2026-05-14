import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { UpdateBracketPositionsRequestDTO } from '../../dtos/bracket/BracketDTOs.js';

export class SwapBracketPositions {
    constructor(private readonly bracketRepository: BracketRepository) { }

    public async execute(request: UpdateBracketPositionsRequestDTO): Promise<void> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(request.id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Swap the positions in the bracket
        bracket.swapPositions(request.position1, request.position2);

        // 3. Persist the changes in the DB
        await this.bracketRepository.update(bracket);
    }
}
