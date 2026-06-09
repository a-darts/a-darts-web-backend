import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { redisClient } from '../../infrastructure/persistence/repositories/RedisMatchCacheRepository.js';

let redisContainer: StartedRedisContainer;

export async function startRedisTestContainer() {
    redisContainer = await new RedisContainer("redis:alpine").start();
    const redisUrl = redisContainer.getConnectionUrl();
    
    // We override the process.env before anyone imports the repository,
    // but since vitest hoists imports, we also need to manually connect
    // the existing instance if it was already initialized with default host.
    
    // In our case, if the file was already imported, it connected to localhost.
    // We disconnect and connect to the new URL.
    redisClient.on('error', () => {}); // Suppress initial connection errors
    redisClient.disconnect();
    
    // Hack: ioredis allows changing options after disconnect and connecting again is not straightforward 
    // unless we use a new instance, but our repository uses a global const. 
    // Let's modify the internal options of the ioredis client.
    (redisClient.options as any).host = redisContainer.getHost();
    (redisClient.options as any).port = redisContainer.getPort();
    
    await redisClient.connect();
}

export async function stopRedisTestContainer() {
    if (redisClient) {
        await redisClient.quit();
    }
    if (redisContainer) {
        await redisContainer.stop();
    }
}

export async function clearRedis() {
    if (redisClient) {
        await redisClient.flushall();
    }
}
