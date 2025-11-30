import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 3001;

export type AppEnv = {
  port: number;
  openaiApiKey?: string;
  nodeEnv?: string;
};

const normalizePort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }

  return parsed;
};

export const loadEnv = (): AppEnv => {
  return {
    port: normalizePort(process.env.PORT),
    openaiApiKey: process.env.OPENAI_API_KEY?.trim(),
    nodeEnv: process.env.NODE_ENV,
  };
};
