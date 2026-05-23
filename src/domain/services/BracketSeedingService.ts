import { IParticipant, ByeParticipant, EmptyParticipant } from "../entities/Participant.js";
import { BracketPosition } from "../entities/Bracket.js";
import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from "../exceptions/ParticipantExceptions.js";

export class BracketSeedingService {
    public validateCount(count: number): void {
        if (count === 0) {
            throw new RegistratedParticipantsEmptyException();
        }
        if (count < 2) {
            throw new RegistratedParticipantsNotEnoughException(2, count);
        }
    }

    /**
     * Calcula la potencia de 2 más cercana (hacia arriba)
     * Ejemplo: 5 participantes -> tamaño 8
     */
    public calculateBracketSize(n: number): number {
        if (n <= 2) return 2;
        return Math.pow(2, Math.ceil(Math.log2(n)));
    }

    /**
     * Dado un array de participantes reales, devuelve BracketPositions
     * barajadas (Fisher-Yates) con Byes intercalados usando Standard
     * Tournament Seeding.
     */
    public generatePositions(participants: IParticipant[]): BracketPosition[] {
        this.validateCount(participants.length);

        const size = this.calculateBracketSize(participants.length);
        const shuffled = this.shuffle([...participants]);
        const slotted = this.fillWithByes(shuffled, size);
        const ordered = this.applySeedingOrder(slotted, size);

        return ordered.map((participant, idx) =>
            BracketPosition.create(participant, idx + 1)
        );
    }


    // --------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------
    private shuffle<T>(items: T[]): T[] {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }

    private fillWithByes(participants: IParticipant[], targetSize: number): IParticipant[] {
        const byes = targetSize - participants.length;
        return [
            ...participants,
            ...Array.from({ length: byes }, () => ByeParticipant.create()),
        ];
    }

    private applySeedingOrder(slots: IParticipant[], size: number): IParticipant[] {
        let order = [0];
        while (order.length < size) {
            order = order.flatMap(i => [i, order.length * 2 - 1 - i]);
        }
        return order.map(i => slots[i]);
    }
}
