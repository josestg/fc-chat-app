import * as process from 'node:process';
import { Algorithm } from 'jsonwebtoken';

export type DatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
};

export type JWTConfig = {
  algorithm: Algorithm;
  expires: string;
  audience: string;
  issuer: string;
  secret: string;
};

type EnvMode = 'production' | 'release' | 'staging' | 'development';

export type AppConfig = {
  env: EnvMode;
  port: number;
};

type Config = {
  app: AppConfig;
  jwt: JWTConfig;
  database: DatabaseConfig;
};

export default (): Config => {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as EnvMode;
  return {
    app: {
      env: nodeEnv,
      port: parseInt(process.env.PORT ?? "3000")
    },
    jwt: {
      algorithm: (process.env.JWT_ALGORITHM ?? 'HS256') as Algorithm,
      expires: process.env.JWT_EXPIRES ?? '1h',
      issuer: process.env.JWT_ISSUER ?? 'chat-app-be-nest',
      audience: process.env.JWT_AUDIENCE ?? 'chat-app-be-nest',
      secret: process.env.JWT_SECRET ?? 'unsecure secret',
    },
    database: {
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      username: process.env.DATABASE_USERNAME ?? 'chat-app-be-nest',
      password: process.env.DATABASE_PASSWORD ?? 'chat-app-be-nest',
      database: process.env.DATABASE_DATABASE ?? 'chat-app-be-nest',
      synchronize: !['production', 'release'].includes(nodeEnv),
    },
  };
};
