import { Match } from "../entities/Match.js";
import { BracketPosition } from "../entities/Bracket.js";
import { ByeParticipant, EmptyParticipant } from "../entities/Participant.js";


interface MatchBlueprint {
    round: number;
    matchIndex: number;
    p1Id: string | null;
    p2Id: string | null;
    isP1Bye: boolean;
    isP2Bye: boolean;
}

export class SingleEliminationMatchGenerator {
    public calculateTotalRounds(positionsCount: number): number {
        if (positionsCount <= 1) return 0;
        return Math.ceil(Math.log2(positionsCount));
    }

    public getNextMatchCoordinates(
        currentRound: number,
        currentMatchIndex: number,
        totalPositions: number
    ): { round: number; matchIndex: number; slot: 'P1' | 'P2' } | null {
        const totalRounds = this.calculateTotalRounds(totalPositions);
        const nextRound = currentRound + 1;

        if (nextRound > totalRounds) return null;

        const zeroBasedIndex = currentMatchIndex - 1;
        const nextMatchIndex = Math.floor(zeroBasedIndex / 2) + 1;
        const slot: 'P1' | 'P2' = zeroBasedIndex % 2 === 0 ? 'P1' : 'P2';

        return { round: nextRound, matchIndex: nextMatchIndex, slot };
    }

    /**
     * Genera la estructura completa de partidos iniciales propagando BYEs.
     */
    public generateMatches(tournamentId: string, positions: BracketPosition[]): Match[] {
        const N = positions.length;
        const round1Size = N / 2;
        const totalMatches = N - 1;

        // 1. Preparar el esqueleto temporal de partidos
        const blueprints = this.initializeBlueprints(totalMatches);

        const sortedPositions = [...positions].sort((a, b) => a.getPosition() - b.getPosition());

        // 2. Poblar la ronda 1 según las posiciones ordenadas del cuadrante
        this.populateRound1(blueprints, sortedPositions, round1Size);

        // 3. Calcular iterativamente las siguientes rondas propagando los flujos de BYEs
        this.propagateByesAcrossRounds(blueprints, round1Size);

        // 4. Mapear los datos temporales a instancias reales de Match
        return blueprints.map((bp: any) => Match.create(
            tournamentId,
            bp.p1Id,
            bp.p2Id,
            bp.isP1Bye,
            bp.isP2Bye,
            bp.round,
            bp.matchIndex,
        ));
    }


    // --------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------
    private initializeBlueprints(count: number): MatchBlueprint[] {
        return Array.from({ length: count }, () => ({
            round: 0,
            matchIndex: 0,
            p1Id: null,
            p2Id: null,
            isP1Bye: false,
            isP2Bye: false,
        }));
    }

    private populateRound1(
        blueprints: MatchBlueprint[],
        sortedPositions: BracketPosition[],
        round1Size: number,
    ): void {
        for (let i = 0; i < round1Size; i++) {
            const posA = sortedPositions[i * 2];
            const posB = sortedPositions[i * 2 + 1];

            blueprints[i].round = 1;
            blueprints[i].matchIndex = i + 1;
            blueprints[i].p1Id = this.resolveId(posA);
            blueprints[i].isP1Bye = posA.isBye();
            blueprints[i].p2Id = this.resolveId(posB);
            blueprints[i].isP2Bye = posB.isBye();
        }
    }

    private propagateByesAcrossRounds(
        blueprints: MatchBlueprint[],
        round1Size: number,
    ): void {
        let roundStart = 0;
        let roundSize = round1Size;
        let round = 1;

        while (roundSize > 1) {
            const nextRoundStart = roundStart + roundSize;
            const nextRoundSize = roundSize / 2;

            // Inicializar coordenadas de la siguiente ronda
            for (let j = 0; j < nextRoundSize; j++) {
                blueprints[nextRoundStart + j].round = round + 1;
                blueprints[nextRoundStart + j].matchIndex = j + 1;
            }

            // Propagar ganadores automáticos por BYE
            for (let i = 0; i < roundSize; i++) {
                const current = blueprints[roundStart + i];
                const byePromotion = this.resolveByePromotion(current);
                if (byePromotion === null) continue;

                const nextIdx = nextRoundStart + Math.floor(i / 2);
                if (i % 2 === 0) {
                    blueprints[nextIdx].p1Id = byePromotion.id;
                    blueprints[nextIdx].isP1Bye = byePromotion.isBye;
                } else {
                    blueprints[nextIdx].p2Id = byePromotion.id;
                    blueprints[nextIdx].isP2Bye = byePromotion.isBye;
                }
            }

            roundStart = nextRoundStart;
            roundSize = nextRoundSize;
            round++;
        }
    }

    /**
     * Si el partido tiene un BYE, devuelve quién avanza y si ese también es BYE.
     * Si no hay BYE en el partido, devuelve null (nada que propagar).
     */
    private resolveByePromotion(
        blueprint: MatchBlueprint,
    ): { id: string | null; isBye: boolean } | null {
        if (blueprint.isP1Bye) return { id: blueprint.p2Id, isBye: blueprint.p2Id === null };
        if (blueprint.isP2Bye) return { id: blueprint.p1Id, isBye: blueprint.p1Id === null };
        return null;
    }

    private resolveId(pos: BracketPosition): string | null {
        const p = pos.getParticipant();
        return p instanceof ByeParticipant || p instanceof EmptyParticipant
            ? null
            : p.getId();
    }
}
