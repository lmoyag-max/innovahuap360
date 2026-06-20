export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    accessTtl: string;
    refreshSecret: string;
    refreshTtlDays: number;
  };
  database: { url: string };
  mail: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
    secure: boolean;
  };
  frontendUrl: string;
  innovaIa: {
    provider: string;
    apiKey: string | null;
  };
  swaggerEnabled: boolean;
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
    }
    return '';
  }
  return value;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS ?? 30),
  },
  database: {
    url: required('DATABASE_URL', 'postgresql://innovahuap:innovahuap@localhost:5432/innovahuap360'),
  },
  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.SMTP_FROM ?? 'InnovaHUAP 360 <no-reply@innovahuap.local>',
    secure: process.env.SMTP_SECURE === 'true',
  },
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  innovaIa: {
    provider: process.env.INNOVAIA_PROVIDER ?? 'none',
    apiKey: process.env.INNOVAIA_API_KEY ?? null,
  },
  swaggerEnabled: process.env.NODE_ENV !== 'production',
});
