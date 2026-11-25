import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
import { config } from 'dotenv';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar .env desde el root del monorepo (cuatro niveles arriba desde apps/backend/src/config)
// apps/backend/src/config -> apps/backend -> apps -> root -> .env
config({ path: resolve(__dirname, '../../../../.env') });
