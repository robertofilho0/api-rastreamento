require('dotenv').config({ quiet: true });
const { z } = require('zod');

const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().default('*'),
    TRACKING_PROVIDER: z.enum(['mock', 'aftership']).default('mock'),
    AFTERSHIP_API_KEY: z.string().optional(),
    AFTERSHIP_BASE_URL: z.url().default('https://api.aftership.com/v4'),
    PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    CACHE_TTL_SECONDS: z.coerce.number().int().nonnegative().default(300),
  })
  .refine((env) => env.TRACKING_PROVIDER !== 'aftership' || env.AFTERSHIP_API_KEY, {
    message: 'AFTERSHIP_API_KEY é obrigatório quando TRACKING_PROVIDER=aftership',
    path: ['AFTERSHIP_API_KEY'],
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  parsed.error.issues.forEach((i) => console.error(`   - ${i.path.join('.')}: ${i.message}`));
  process.exit(1);
}

module.exports = parsed.data;
