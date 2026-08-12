// Resets the local file-DB fallback (backend/data/db.json) back to the
// checked-in demo seed (backend/data/seed.json). Only touches the file
// fallback — it has no effect on a real MySQL/Aiven database.
//
// Usage: npm run seed

const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, '..', 'backend', 'data', 'seed.json');
const dbPath = path.join(__dirname, '..', 'backend', 'data', 'db.json');

const seed = fs.readFileSync(seedPath, 'utf8');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
fs.writeFileSync(dbPath, seed, 'utf8');

console.log(`Local file DB reset from seed: ${dbPath}`);
