// src/config/database.ts
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);

// Exportamos una única instancia lista para usar
// log: [] desactiva los logs de queries de Prisma
export const prisma = new PrismaClient({
  adapter,
  log: [],
});
