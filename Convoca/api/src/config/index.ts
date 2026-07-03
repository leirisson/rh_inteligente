import { config as dotenvConfig } from "dotenv";
import { z } from "zod";

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenvConfig({ path: envFile });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default("0.0.0.0"),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_DEFAULT_MODEL: z.string().default("anthropic/claude-3.5-sonnet"),

  OPENAI_API_KEY: z.string().min(1),

  CORS_ORIGIN: z.string().default("*"),

  // URL pública onde este servidor pode ser alcançado — usada para registrar o webhook
  // por-instância na Evolution API (POST /webhook/set/:instanceName)
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:3334"),

  // Evolution API (WhatsApp) — credenciais mestras do servidor Evolution API compartilhado.
  // A partir da Spec 14, a instância/token por tenant vive em TenantIntegration; estas env vars
  // seguem sendo necessárias para chamar /instance/create, /instance/connect, /webhook/set e
  // /instance/logout na Evolution API. Sem credenciais reais ainda em todos os ambientes, opcionais.
  EVOLUTION_API_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  EVOLUTION_WEBHOOK_SECRET: z.string().min(16).optional(),

  // SMTP (Nodemailer) — opcional, degrada com erro tratável se ausente
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("Convoca <no-reply@convoca.app>"),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(JSON.stringify(_parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const config = _parsed.data;
export type Config = typeof config;
