// Usage: node server/scripts/seedStores.js
// Creates/updates the admins, pickup staff and riders for every store in the registry.
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import { seedCoreEntities } from '../config/seedCoreEntities.js';

dotenv.config();
const ok = await connectDB();
if (!ok) {
  console.error('Database not connected. Set MONGO_URI in .env and try again.');
  process.exit(1);
}
const res = await seedCoreEntities();
console.log(res);
process.exit(res.success ? 0 : 1);
