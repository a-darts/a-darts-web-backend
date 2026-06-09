import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RedisMatchCacheRepository } from '../../../../infrastructure/persistence/repositories/RedisMatchCacheRepository.js';
import { startRedisTestContainer, stopRedisTestContainer, clearRedis } from '../../redis-setup.js';

describe('RedisMatchCacheRepository Integration Tests', () => {
    let repository: RedisMatchCacheRepository;

    beforeAll(async () => {
        await startRedisTestContainer();
        repository = new RedisMatchCacheRepository();
    }, 60000);

    afterAll(async () => {
        await stopRedisTestContainer();
    });

    beforeEach(async () => {
        await clearRedis();
    });

    describe('Throws Management', () => {
        it('should successfully add and retrieve throws', async () => {
            const matchId = 'match-123';
            const throw1 = { player: 'p1', score: 60 };
            const throw2 = { player: 'p2', score: 100 };

            await repository.addThrow(matchId, throw1);
            await repository.addThrow(matchId, throw2);

            const throws = await repository.getThrows(matchId);
            expect(throws).toHaveLength(2);
            expect(throws[0]).toEqual(throw1);
            expect(throws[1]).toEqual(throw2);
        });

        it('should return empty array when no throws exist', async () => {
            const throws = await repository.getThrows('non-existent-match');
            expect(throws).toEqual([]);
        });

        it('should retrieve the last throw', async () => {
            const matchId = 'match-123';
            await repository.addThrow(matchId, { player: 'p1', score: 60 });
            await repository.addThrow(matchId, { player: 'p2', score: 100 });

            const lastThrow = await repository.getLastThrow(matchId);
            expect(lastThrow).toEqual({ player: 'p2', score: 100 });
        });

        it('should return null for last throw if match has no throws', async () => {
            const lastThrow = await repository.getLastThrow('empty-match');
            expect(lastThrow).toBeNull();
        });

        it('should successfully remove the last throw (undo)', async () => {
            const matchId = 'match-123';
            const throw1 = { player: 'p1', score: 60 };
            const throw2 = { player: 'p2', score: 100 };

            await repository.addThrow(matchId, throw1);
            await repository.addThrow(matchId, throw2);

            const removed = await repository.removeLastThrow(matchId);
            expect(removed).toEqual(throw2);

            const remaining = await repository.getThrows(matchId);
            expect(remaining).toHaveLength(1);
            expect(remaining[0]).toEqual(throw1);
        });

        it('should return null when removing from an empty match', async () => {
            const removed = await repository.removeLastThrow('empty-match');
            expect(removed).toBeNull();
        });

        it('should successfully rebuild history completely', async () => {
            const matchId = 'match-123';
            
            // Initial faulty history
            await repository.addThrow(matchId, { player: 'p1', score: 10 });
            
            const newHistory = [
                { player: 'p1', score: 60 },
                { player: 'p2', score: 100 },
                { player: 'p1', score: 140 }
            ];

            await repository.rebuildHistory(matchId, newHistory);

            const retrieved = await repository.getThrows(matchId);
            expect(retrieved).toHaveLength(3);
            expect(retrieved).toEqual(newHistory);
        });

        it('should not rebuild if new history is empty', async () => {
            const matchId = 'match-123';
            const original = { player: 'p1', score: 60 };
            await repository.addThrow(matchId, original);

            await repository.rebuildHistory(matchId, []);

            const retrieved = await repository.getThrows(matchId);
            expect(retrieved).toHaveLength(1);
            expect(retrieved[0]).toEqual(original);
        });
    });

    describe('Match Status Management', () => {
        it('should successfully set and get match status', async () => {
            const matchId = 'match-456';
            await repository.setMatchStatus(matchId, 'IN_PROGRESS');

            const status = await repository.getMatchStatus(matchId);
            expect(status).toBe('IN_PROGRESS');
        });

        it('should return null for non-existent match status', async () => {
            const status = await repository.getMatchStatus('unknown-match');
            expect(status).toBeNull();
        });
    });

    describe('Board Active Match Management', () => {
        it('should successfully set and get active match for board', async () => {
            const boardId = 'B1';
            const matchId = 'match-789';

            await repository.setActiveMatchForBoard(boardId, matchId);

            const retrieved = await repository.getActiveMatchForBoard(boardId);
            expect(retrieved).toBe(matchId);
        });

        it('should successfully clear board active match', async () => {
            const boardId = 'B1';
            const matchId = 'match-789';

            await repository.setActiveMatchForBoard(boardId, matchId);
            await repository.clearBoardActiveMatch(boardId);

            const retrieved = await repository.getActiveMatchForBoard(boardId);
            expect(retrieved).toBeNull();
        });
    });

    describe('Match Cleanup', () => {
        it('should successfully clear all match data including board link', async () => {
            const matchId = 'match-999';
            const boardId = 'B9';

            await repository.addThrow(matchId, { p: 1 });
            await repository.setMatchStatus(matchId, 'FINISHED');
            await repository.setActiveMatchForBoard(boardId, matchId);

            await repository.clearMatch(matchId, boardId);

            expect(await repository.getThrows(matchId)).toEqual([]);
            expect(await repository.getMatchStatus(matchId)).toBeNull();
            expect(await repository.getActiveMatchForBoard(boardId)).toBeNull();
        });

        it('should successfully clear match data without board link', async () => {
            const matchId = 'match-888';

            await repository.addThrow(matchId, { p: 1 });
            await repository.setMatchStatus(matchId, 'FINISHED');

            await repository.clearMatch(matchId);

            expect(await repository.getThrows(matchId)).toEqual([]);
            expect(await repository.getMatchStatus(matchId)).toBeNull();
        });
    });
});
