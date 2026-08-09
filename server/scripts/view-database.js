import * as database from '../config/database.js';

const sensitiveColumns = new Set(['password_hash', 'token_hash']);
const sampleLimit = Number(process.argv[2] || 5);

const quoteIdentifier = (value) => `\`${String(value).replaceAll('`', '``')}\``;

try {
  const tables = await database.query(
    'SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME',
  );
  console.log(`Database: ${process.env.DB_NAME || 'kickz_lk'}`);
  if (!tables.length) console.log('No tables found.');

  for (const table of tables) {
    const tableName = table.name;
    const [{ count }] = await database.query(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(tableName)}`);
    console.log(`\n${tableName} (${count} rows)`);
    const rows = await database.query(`SELECT * FROM ${quoteIdentifier(tableName)} LIMIT ${Number.isInteger(sampleLimit) ? sampleLimit : 5}`);
    for (const row of rows) {
      for (const column of Object.keys(row)) {
        if (sensitiveColumns.has(column)) row[column] = '[REDACTED]';
      }
      console.log(JSON.stringify(row));
    }
  }
} finally {
  await database.closeDatabase();
}
