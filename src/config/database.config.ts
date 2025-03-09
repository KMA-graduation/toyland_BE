import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { types } from 'pg';
import { DataSource } from 'typeorm';

dotenv.config();

const ormConfig = {
  type: 'postgres',
  host: process.env.DATABASE_POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_POSTGRES_PORT) || 5432,
  maxPool: parseInt(process.env.DATABASE_MAX_POOL) || 20,
  username: process.env.DATABASE_POSTGRES_USERNAME || 'root',
  password: process.env.DATABASE_POSTGRES_PASSWORD || '123456',
  database: process.env.DATABASE_NAME || 'ecommerce',
  logging: process.env.NODE_ENV === 'development',
};

const connectionOptions = new DataSource({
  type: 'postgres',
  host: ormConfig.host,
  port: ormConfig.port,
  username: ormConfig.username,
  password: ormConfig.password,
  database: ormConfig.database,
  // entities: ['dist/entities/**/*.entity.{ts,js}', 'src/entities/*.{ts,js}'],
  migrations: ['dist/database/migrations/*.{ts,js}'],
  // We are using migrations, synchronize should be set to false.
  synchronize: false,
  // Run migrations automatically,
  // you can disable this if you prefer running migration manually.
  migrationsRun: false,
  logging: true,
  extra: {
    max: ormConfig.maxPool,
  },
  namingStrategy: new SnakeNamingStrategy(),
});

types.setTypeParser(types.builtins.INT8, (value: string): number =>
  parseFloat(value),
);

connectionOptions.initialize();
export default connectionOptions;
