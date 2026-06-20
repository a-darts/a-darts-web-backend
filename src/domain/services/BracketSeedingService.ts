import { IParticipant, ByeParticipant, EmptyParticipant } from "../entities/Participant.js";
import { BracketPosition } from "../entities/Bracket.js";
import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from "../exceptions/ParticipantExceptions.js";

export class BracketSeedingService {
    public validateCount(count: number): void {
        if (count === 0) {
            throw new RegistratedParticipantsEmptyException();
        }
        if (count < 2) {
            throw new RegistratedParticipantsNotEnoughException();
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
     * barajadas (Fisher-Yates) con Byes intercalados según algoritmo
     */
    public generatePositions(participants: IParticipant[]): BracketPosition[] {
        this.validateCount(participants.length);

        const size = this.calculateBracketSize(participants.length);
        const shuffled = this.shuffle([...participants]);
        const slotted = this.fillWithByesOrdered(shuffled, size);

        return slotted.map((participant, idx) =>
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

    private fillWithByesOrdered(participants: IParticipant[], size: number): IParticipant[] {
        const byeCount = size - participants.length;
        const allByePositions = this.byesOrder(size);
        const byePositions = new Set(allByePositions.slice(0, byeCount));

        const slots: IParticipant[] = new Array(size);

        for (const pos of byePositions) {
            slots[pos] = ByeParticipant.create();
        }

        let pi = 0;
        for (let i = 0; i < size; i++) {
            if (!byePositions.has(i)) {
                slots[i] = participants[pi++];
            }
        }

        return slots;
    }

    private byesOrder(n: number): number[] {
        if (n == 2) {
            return [0];
        }

        const prev = this.byesOrder(n / 2);
        const result: number[] = [];
        for (const s of prev) {
            result.push(s);
            result.push(n - 2 - s);
        }
        return result;
    }
}
