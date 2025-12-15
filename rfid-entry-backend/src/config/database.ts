import { Sequelize, Options } from 'sequelize';
import dotenv from 'dotenv';
import * as pg from 'pg';

dotenv.config();

const useSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.DB_HOST ? process.env.DB_HOST.includes('neon') : false);

const sequelizeConfig: Options = {
  dialect: 'postgres',
  dialectModule: pg,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lens_system',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'USTPeLib2025',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
};

if (useSsl) {
  // Neon and some managed Postgres require SSL. `rejectUnauthorized: false` is
  // commonly used for hosted services that provide TLS but not a CA chain
  // trusted by the host environment. Make this configurable via `DB_SSL=true`.
  sequelizeConfig.dialectOptions = {
    ...(sequelizeConfig.dialectOptions as object),
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

const sequelize = new Sequelize(sequelizeConfig);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;
