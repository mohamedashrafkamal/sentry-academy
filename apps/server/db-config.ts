import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Event listeners for pool
pool.on('error', (err: any) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Shutdown handler
process.on('SIGINT', () => {
  pool.end().then(() => {
    console.log('Pool has ended');
    process.exit(0);
  });
});

export default pool;
