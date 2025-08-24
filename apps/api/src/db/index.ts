import { drizzle } from 'drizzle-orm/postgres-js';
import postgres = require('postgres');
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema });
