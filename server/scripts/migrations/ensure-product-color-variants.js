export const ensureProductColorVariantsColumn = async (connection, databaseName) => {
  const [columns] = await connection.execute(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [databaseName, 'products', 'color_variants'],
  );

  if (columns.length) return false;

  await connection.query('ALTER TABLE products ADD COLUMN color_variants JSON NULL AFTER color_variations');
  return true;
};
