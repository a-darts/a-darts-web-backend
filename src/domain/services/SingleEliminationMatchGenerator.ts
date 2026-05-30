import { Match } from "../entities/Match.js";
import { BracketPosition } from "../entities/Bracket.js";
import { ByeParticipant, EmptyParticipant, ParticipantTypes } from "../entities/Participant.js";


interface MatchBlueprint {
    round: number;
    matchIndex: number;
    p1Id: string | null;
    p2Id: string | null;
    p1Type: ParticipantTypes;
    p2Type: ParticipantTypes;
}

export class SingleEliminationMatchGenerator {
    /**
     * Returns the total number of rounds needed for a given number of bracket positions.
     */
    public calculateTotalRounds(positionsCount: number): number {
        if (positionsCount <= 1) return 0;
        return Math.ceil(Math.log2(positionsCount));
    }

    /**
     * Given a match's round and index, returns the coordinates and slot of the next match
     * the winner should advance to. Returns null if the match is the final.
     */
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
     * Generates the full initial match structure for a single-elimination bracket,
     * propagating BYEs automatically across rounds.
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
        return blueprints.map((bp: MatchBlueprint) => Match.create(
            tournamentId,
            bp.p1Id,
            bp.p2Id,
            bp.p1Type,
            bp.p2Type,
            bp.round,
            bp.matchIndex,
        ));
    }


    // --------------------------------------------------------------------
    // HELPERS
    // --------------------------------------------------------------------

    /**
     * Creates an array of empty match blueprints to be filled in subsequent steps.
     */
    private initializeBlueprints(count: number): MatchBlueprint[] {
        return Array.from({ length: count }, () => ({
            round: 0,
            matchIndex: 0,
            p1Id: null,
            p2Id: null,
            p1Type: ParticipantTypes.EMPTY,
            p2Type: ParticipantTypes.EMPTY,
        }));
    }

    /**
     * Fills the round 1 blueprints by pairing consecutive bracket positions.
     */
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
            blueprints[i].p1Type = this.resolveType(posA);
            blueprints[i].p2Id = this.resolveId(posB);
            blueprints[i].p2Type = this.resolveType(posB);
        }
    }
    

    /**
     * Iterates round by round, forwarding automatic BYE winners into the next round's blueprints.
     */
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

            for (let j = 0; j < nextRoundSize; j++) {
                blueprints[nextRoundStart + j].round = round + 1;
                blueprints[nextRoundStart + j].matchIndex = j + 1;
            }

            for (let i = 0; i < roundSize; i++) {
                const current = blueprints[roundStart + i];
                const byePromotion = this.resolveByePromotion(current);
                if (byePromotion === null) continue;

                const nextIdx = nextRoundStart + Math.floor(i / 2);
                if (i % 2 === 0) {
                    blueprints[nextIdx].p1Id = byePromotion.id;
                    blueprints[nextIdx].p1Type = byePromotion.type;
                } else {
                    blueprints[nextIdx].p2Id = byePromotion.id;
                    blueprints[nextIdx].p2Type = byePromotion.type;
                }
            }

            roundStart = nextRoundStart;
            roundSize = nextRoundSize;
            round++;
        }
    }


    /**
     * If a blueprint contains a BYE, returns the advancing participant and their type. Returns null if no BYE is present.
     */
    private resolveByePromotion(
        blueprint: MatchBlueprint,
    ): { id: string | null; type: ParticipantTypes } | null {
        if (blueprint.p1Type === ParticipantTypes.BYE) {
            return {
                id: blueprint.p2Id,
                type: blueprint.p2Id === null ? ParticipantTypes.EMPTY : ParticipantTypes.REGISTERED,
            };
        }
        if (blueprint.p2Type === ParticipantTypes.BYE) {
            return {
                id: blueprint.p1Id,
                type: blueprint.p1Id === null ? ParticipantTypes.EMPTY : ParticipantTypes.REGISTERED,
            };
        }
        return null;
    }

    /**
     * Extracts the participant ID from a bracket position, returning null for BYE or EMPTY slots.
     */
    private resolveId(pos: BracketPosition): string | null {
        const p = pos.getParticipant();
        return p instanceof ByeParticipant || p instanceof EmptyParticipant
            ? null
            : p.getId();
    }

    /**
     * Determines the ParticipantTypes value for a bracket position based on its participant instance.
     */
    private resolveType(pos: BracketPosition): ParticipantTypes {
        const p = pos.getParticipant();
        if (p instanceof ByeParticipant) return ParticipantTypes.BYE;
        if (p instanceof EmptyParticipant) return ParticipantTypes.EMPTY;
        return ParticipantTypes.REGISTERED;
    }
}
