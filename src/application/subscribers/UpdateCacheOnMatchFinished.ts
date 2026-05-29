import { MatchFinishedEvent } from '../../domain/events/MatchEvents.js';
import { IMatchCacheRepository } from '../../domain/repositories/IMatchCacheRepository.js';
import { MatchStatus } from '../../domain/entities/Match.js';

export class UpdateCacheOnMatchFinished {
    constructor(private readonly matchCacheRepository: IMatchCacheRepository) {}

    public async on(event: MatchFinishedEvent): Promise<void> {
        try {
            // 1. Sincronizamos el estado del partido en Redis
            await this.matchCacheRepository.setMatchStatus(event.matchId, MatchStatus.FINISHED);

            // 2. Liberamos la diana si el partido tenía una asignada
            // MIRAR
            // if (event.boardNumber) {
            //     // Si tus llaves de tableros/dianas en Redis usan strings, lo casteamos.
            //     const boardShortId = String(event.boardNumber);
            //     await this.matchCacheRepository.clearBoardActiveMatch(boardShortId);
            // }
            
            console.log(`[CacheSubscriber] Estado sincronizado con éxito para el match: ${event.matchId}`);
        } catch (error) {
            console.error(`[CacheSubscriber] Error intentando actualizar la caché de Redis para el match ${event.matchId}:`, error);
        }
    }
}
