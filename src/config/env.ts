import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    CORS_ORIGIN: z.string().default('*'),
    TRACKING_PROVIDER: z.enum(['mock', 'aftership']).default('mock'),
    AFTERSHIP_API_KEY: z.string().optional(),
    AFTERSHIP_BASE_URL: z.url().default('https://api.aftership.com/v4'),
    PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
    // Opcional: sem RabbitMQ, os lotes são processados em memória
    RABBITMQ_URL: z.string().optional(),
    RABBITMQ_QUEUE: z.string().default('rastreio.lotes'),
  })
  .refine(
    (env) => env.TRACKING_PROVIDER !== 'aftership' || env.AFTERSHIP_API_KEY,
    {
      message:
        'AFTERSHIP_API_KEY é obrigatório quando TRACKING_PROVIDER=aftership',
      path: ['AFTERSHIP_API_KEY'],
    },
  );

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const detalhes = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${detalhes}`);
  }
  return parsed.data;
}
