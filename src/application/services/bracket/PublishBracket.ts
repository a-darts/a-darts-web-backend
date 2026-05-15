import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';

export class PublishBracket {
    constructor(
        private readonly bracketRepository: BracketRepository,
    ) { }

    public async execute(id: string): Promise<void> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Update the status in the bracket object
        bracket.publish();

        // 3. Persist the changes in the DB
        await this.bracketRepository.update(bracket);
    }
}
