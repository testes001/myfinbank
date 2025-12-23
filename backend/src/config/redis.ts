import { createClient } from 'redis';
import { config } from '@/config';
import { log } from '@/utils/logger';

let redisClient: ReturnType<typeof createClient> | null = null;

if (config.redisUrl) {
  try {
    const client = createClient({
      url: config.redisUrl,
      password: config.redisPassword || undefined,
      database: config.redisDb,
    });

    client.on('error', (err) => log.error('Redis client error', err as Error));
    client.connect().catch((err) => log.error('Redis connection failed', err as Error));

    redisClient = client;
  } catch (error) {
    log.error('Failed to initialize Redis client', error as Error);
    redisClient = null;
  }
}

export default redisClient;
