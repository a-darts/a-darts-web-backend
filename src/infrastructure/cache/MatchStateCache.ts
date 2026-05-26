import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class MatchStateCache {
    /**
     * Guarda una tirada en la lista de tiradas del partido
     */
    static async addThrow(matchId: string, throwData: any): Promise<void> {
        const key = `match:${matchId}:throws`;
        await redis.rpush(key, JSON.stringify(throwData));
        // Opcional: configurar un TTL para que no viva eternamente si falla el borrado
        await redis.expire(key, 60 * 60 * 24); // 24 horas
    }

    /**
     * Recupera todas las tiradas de un partido
     */
    static async getThrows(matchId: string): Promise<any[]> {
        const key = `match:${matchId}:throws`;
        const data = await redis.lrange(key, 0, -1);
        return data.map(item => JSON.parse(item));
    }

    /**
     * Vincula un partido activo a una diana específica
     */
    static async setActiveMatchForBoard(boardId: string, matchId: string): Promise<void> {
        const key = `board:${boardId}:active_match`;
        await redis.set(key, matchId);
        await redis.expire(key, 60 * 60 * 24); // 24 horas de seguridad
    }

    /**
     * Recupera el ID del partido activo asignado a una diana
     */
    static async getActiveMatchForBoard(boardId: string): Promise<string | null> {
        const key = `board:${boardId}:active_match`;
        return await redis.get(key);
    }

    /**
     * Borra los datos del partido cuando termina
     */
    static async clearMatch(matchId: string): Promise<void> {
        const key = `match:${matchId}:throws`;
        await redis.del(key);
    }
}
