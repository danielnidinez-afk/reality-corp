import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().min(1).default('127.0.0.1'),
  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional()
});

export type BackendConfig = z.infer<typeof EnvSchema>;

/** Parses and validates backend runtime configuration, enforcing Supabase keys in production. */
export function loadBackendConfig(rawEnv: Record<string, string | undefined> = process.env): BackendConfig {
  const parsed = EnvSchema.parse(rawEnv);
  if (parsed.NODE_ENV === 'production') {
    if (!parsed.SUPABASE_URL || !parsed.SUPABASE_ANON_KEY || !parsed.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Production mode requires SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY');
    }
  }
  return parsed;
}

