import { drizzle } from 'drizzle-orm/postgres-js';
import postgres = require('postgres');
import * as schema from './schema';

const connectionString =
  'postgresql://filecasedb_owner:npg_A5Endu9OahFt@ep-rough-rice-a8cyuqj6.eastus2.azure.neon.tech/filecasedb?sslmode=require&channel_binding=require';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
