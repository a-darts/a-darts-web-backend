import { Redis } from 'ioredis';
import { MatchCacheRepository } from '../../../domain/repositories/MatchCacheRepository.js';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class RedisMatchCacheRepository implements MatchCacheRepository {
    /**
     * Guarda una tirada en la lista de tiradas del partido
     */
    public async addThrow(matchId: string, throwData: any): Promise<void> {
        const key = `match:${matchId}:throws`;
        await redis.rpush(key, JSON.stringify(throwData));
        // Opcional: configurar un TTL para que no viva eternamente si falla el borrado
        await redis.expire(key, 60 * 60 * 24); // 24 horas
    }

    /**
     * Elimina y retorna la última tirada de la lista de Redis (Undo)
     */
    public async removeLastThrow(matchId: string): Promise<any | null> {
        const key = `match:${matchId}:throws`;
        const lastThrow = await redis.rpop(key); // RPOP remueve y devuelve el último elemento

        if (!lastThrow) return null;

        try {
            return JSON.parse(lastThrow);
        } catch (error) {
            console.error(`[RedisMatchCacheRepository] Error al parsear tirada eliminada ${matchId}:`, error);
            return null;
        }
    }

    /**
     * Recupera todas las tiradas de un partido
     */
    public async getThrows(matchId: string): Promise<any[]> {
        const key = `match:${matchId}:throws`;
        const data = await redis.lrange(key, 0, -1);
        return data.map(item => JSON.parse(item));
    }

    /**
     * Vincula un partido activo a una diana específica
     */
    public async setActiveMatchForBoard(boardShortId: string, matchId: string): Promise<void> {
        const key = `board:${boardShortId}:active_match`;
        await redis.set(key, matchId);
        await redis.expire(key, 60 * 60 * 24); // 24 horas de seguridad
    }

    /**
     * Recupera el ID del partido activo asignado a una diana
     */
    public async getActiveMatchForBoard(boardShortId: string): Promise<string | null> {
        const key = `board:${boardShortId}:active_match`;
        return await redis.get(key);
    }

    /**
     * Recupera el último estado guardado del partido (la última tirada)
     */
    public async getLastThrow(matchId: string): Promise<any | null> {
        const key = `match:${matchId}:throws`;

        // Usamos el índice -1 para obtener el último elemento insertado eficientemente
        const lastThrow = await redis.lindex(key, -1);

        if (!lastThrow) {
            return null;
        }

        try {
            return JSON.parse(lastThrow);
        } catch (error) {
            console.error(`[RedisMatchCacheRepository] Error al parsear el último estado del match ${matchId}:`, error);
            return null;
        }
    }

    /**
     * Borra los datos del partido cuando termina
     */
    public async clearMatch(matchId: string, boardShortId?: string): Promise<void> {
        const throwsKey = `match:${matchId}:throws`;
        const statusKey = `match:${matchId}:status`;

        await redis.del(throwsKey);
        await redis.del(statusKey);

        if (boardShortId) {
            const boardKey = `board:${boardShortId}:active_match`;
            await redis.del(boardKey);
        }
    }

    /**
     * Libera una diana eliminando su vinculación con cualquier partido activo
     */
    public async clearBoardActiveMatch(boardShortId: string): Promise<void> {
        const boardKey = `board:${boardShortId}:active_match`;
        await redis.del(boardKey);
    }

    /**
     * Vacía el historial viejo de tiradas de un match en Redis y guarda el nuevo listado corregido
     */
    public async rebuildHistory(matchId: string, newHistory: any[]): Promise<void> {
        const key = `match:${matchId}:throws`;

        if (!newHistory || newHistory.length === 0) {
            console.warn(`[RedisMatchCacheRepository] Intento de reconstrucción con historial vacío para matchId: ${matchId}. Abortando.`);
            return;
        }

        try {
            // Usamos MULTI para abrir una transacción transaccional real y aislada en Redis
            const tx = redis.multi();

            // 1. Borramos de forma segura el listado antiguo
            tx.del(key);

            // 2. Insertamos uno a uno los nuevos objetos mapeados con sus scores correspondientes
            newHistory.forEach(throwData => {
                if (throwData) {
                    tx.rpush(key, JSON.stringify(throwData));
                }
            });

            // 3. Re-configuramos el TTL de seguridad (24 horas)
            tx.expire(key, 60 * 60 * 24);

            // Ejecutamos la transacción de forma atómica
            const results = await tx.exec();

            // Validamos que ningún comando de la transacción haya fallado
            const hasErrors = results?.some(res => res[0] !== null);
            if (hasErrors) {
                console.error(`[RedisMatchCacheRepository] Errores en la transacción MULTI de rebuild para ${matchId}:`, results);
            } else {
                console.log(`[RedisMatchCacheRepository] Caché reconstruida con éxito de forma atómica. ${newHistory.length} estados guardados para matchId: ${matchId}`);
            }
        } catch (error) {
            console.error(`[RedisMatchCacheRepository] Error crítico en rebuildHistory para matchId ${matchId}:`, error);
            throw error;
        }
    }

    /**
     * Guarda el estado actual del partido (READY, IN_PROGRESS, etc.)
     */
    public async setMatchStatus(matchId: string, status: string): Promise<void> {
        const key = `match:${matchId}:status`;
        await redis.set(key, status);
        await redis.expire(key, 60 * 60 * 24); // 24 horas de seguridad
    }

    /**
     * Recupera el estado actual del partido
     */
    public async getMatchStatus(matchId: string): Promise<string | null> {
        const key = `match:${matchId}:status`;
        return await redis.get(key);
    }
}
