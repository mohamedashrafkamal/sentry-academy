#!/usr/bin/env bun

import postgres from 'postgres';
import { randomBytes } from 'crypto';

interface CreateReadOnlyUserOptions {
  username?: string;
  password?: string;
  databaseName?: string;
  schemas?: string[];
}

// Helper function to escape SQL identifiers
function escapeIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

// Helper function to escape SQL literals
function escapeLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function createReadOnlyUser(options: CreateReadOnlyUserOptions = {}) {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Default options
  const {
    username = 'readonly_user',
    password = generateSecurePassword(),
    databaseName = extractDatabaseName(DATABASE_URL),
    schemas = ['public']
  } = options;

  console.log('🔌 Connecting to PostgreSQL...');
  
  // Connect as admin user (from DATABASE_URL)
  const adminSql = postgres(DATABASE_URL);

  try {
    console.log(`👤 Creating read-only user: ${username}`);
    
    // Create the user if it doesn't exist
    await adminSql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = ${escapeLiteral(username)}) THEN
          EXECUTE format('CREATE ROLE %I WITH LOGIN PASSWORD %L', ${escapeLiteral(username)}, ${escapeLiteral(password)});
        ELSE
          EXECUTE format('ALTER ROLE %I WITH PASSWORD %L', ${escapeLiteral(username)}, ${escapeLiteral(password)});
        END IF;
      END
      $$;
    `);

    console.log('🔒 Setting up read-only permissions...');
    
    // Grant connect permission to database
    await adminSql.unsafe(`GRANT CONNECT ON DATABASE ${escapeIdentifier(databaseName)} TO ${escapeIdentifier(username)}`);
    
    // Grant usage on schemas and select on all tables
    for (const schema of schemas) {
      console.log(`📋 Granting permissions on schema: ${schema}`);
      
      // Grant usage on schema
      await adminSql.unsafe(`GRANT USAGE ON SCHEMA ${escapeIdentifier(schema)} TO ${escapeIdentifier(username)}`);
      
      // Grant select on all existing tables in schema
      await adminSql.unsafe(`GRANT SELECT ON ALL TABLES IN SCHEMA ${escapeIdentifier(schema)} TO ${escapeIdentifier(username)}`);
      
      // Grant select on all future tables in schema
      await adminSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${escapeIdentifier(schema)} GRANT SELECT ON TABLES TO ${escapeIdentifier(username)}`);
      
      // Grant usage on all sequences (for id columns)
      await adminSql.unsafe(`GRANT USAGE ON ALL SEQUENCES IN SCHEMA ${escapeIdentifier(schema)} TO ${escapeIdentifier(username)}`);
      await adminSql.unsafe(`ALTER DEFAULT PRIVILEGES IN SCHEMA ${escapeIdentifier(schema)} GRANT USAGE ON SEQUENCES TO ${escapeIdentifier(username)}`);
    }

    // Ensure the user cannot create, modify, or delete anything
    await adminSql.unsafe(`ALTER ROLE ${escapeIdentifier(username)} SET default_transaction_read_only = true`);

    console.log('✅ Read-only user created successfully!');
    console.log('\n📋 Connection Details:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Database: ${databaseName}`);
    
    // Create connection string for the read-only user
    const url = new URL(DATABASE_URL);
    url.username = username;
    url.password = password;
    
    console.log(`\n🔗 Read-only DATABASE_URL:`);
    console.log(`${url.toString()}`);
    
    console.log('\n⚠️  Store these credentials securely!');
    console.log('💡 You can now use this user for read-only database queries');

  } catch (error) {
    console.error('❌ Error creating read-only user:', error);
    process.exit(1);
  } finally {
    await adminSql.end();
  }
}

function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  const bytes = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  
  return password;
}

function extractDatabaseName(databaseUrl: string): string {
  try {
    const url = new URL(databaseUrl);
    return url.pathname.slice(1); // Remove leading slash
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format');
    process.exit(1);
  }
}

// CLI interface
if (import.meta.main) {
  const args = process.argv.slice(2);
  const options: CreateReadOnlyUserOptions = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    
    switch (flag) {
      case '--username':
      case '-u':
        options.username = value;
        break;
      case '--password':
      case '-p':
        options.password = value;
        break;
      case '--database':
      case '-d':
        options.databaseName = value;
        break;
      case '--schemas':
      case '-s':
        options.schemas = value.split(',');
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: bun run scripts/create-readonly-user.ts [options]

Options:
  -u, --username    Username for the read-only user (default: readonly_user)
  -p, --password    Password for the read-only user (default: auto-generated)
  -d, --database    Database name (default: extracted from DATABASE_URL)
  -s, --schemas     Comma-separated list of schemas (default: public)
  -h, --help        Show this help message

Environment Variables:
  DATABASE_URL      PostgreSQL connection string (required)

Examples:
  bun run scripts/create-readonly-user.ts
  bun run scripts/create-readonly-user.ts --username analytics_user
  bun run scripts/create-readonly-user.ts --username reporter --schemas public,analytics
        `);
        process.exit(0);
    }
  }
  
  createReadOnlyUser(options);
}

export { createReadOnlyUser }; 