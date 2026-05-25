import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';

export class DeleteBracket {
  constructor(private readonly bracketRepository: BracketRepository) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findById(id);
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 2. Delete the bracket
    bracket.delete();

    // 3. Delte the bracket in the DB
    await this.bracketRepository.delete(id);
  }
}
