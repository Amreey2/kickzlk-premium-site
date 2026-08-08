const parseJson = (value, fallback = []) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const mapImport = (row) => ({
  id: Number(row.id),
  fileName: row.file_name,
  importedBy: row.imported_by === null ? null : Number(row.imported_by),
  adminEmail: row.admin_email || null,
  status: row.status,
  totalRows: Number(row.total_rows),
  successfulRows: Number(row.successful_rows),
  failedRows: Number(row.failed_rows),
  createdRows: Number(row.created_rows),
  updatedRows: Number(row.updated_rows),
  createdAt: row.created_at,
  completedAt: row.completed_at,
});

export default class ProductImportModel {
  constructor(database) { this.database = database; }

  async create({ fileName, importedBy, totalRows }) {
    const result = await this.database.query(
      'INSERT INTO product_imports (file_name, imported_by, total_rows) VALUES (?, ?, ?)',
      [fileName, importedBy, totalRows],
    );
    return Number(result.insertId);
  }

  async complete(id, summary) {
    await this.database.query(
      `UPDATE product_imports SET status = 'Completed', successful_rows = ?, failed_rows = ?,
       created_rows = ?, updated_rows = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [summary.successfulRows, summary.failedRows, summary.createdRows, summary.updatedRows, id],
    );
  }

  async addFailures(importId, failures) {
    for (const failure of failures) {
      await this.database.query(
        `INSERT INTO product_import_failures
         (import_id, \`row_number\`, sku, error_codes, reasons, row_data) VALUES (?, ?, ?, ?, ?, ?)`,
        [importId, failure.rowNumber, failure.sku || null, JSON.stringify(failure.errors.map((error) => error.code)),
          JSON.stringify(failure.errors.map((error) => error.message)), JSON.stringify(failure.source)],
      );
    }
  }

  async list(limit = 50) {
    const requestedLimit = Number(limit);
    const safeLimit = Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 50;
    const rows = await this.database.query(
      `SELECT i.*, a.email AS admin_email FROM product_imports i
       LEFT JOIN administrators a ON a.id = i.imported_by ORDER BY i.created_at DESC LIMIT ${safeLimit}`,
    );
    return rows.map(mapImport);
  }

  async findById(id) {
    const rows = await this.database.query(
      `SELECT i.*, a.email AS admin_email FROM product_imports i
       LEFT JOIN administrators a ON a.id = i.imported_by WHERE i.id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? mapImport(rows[0]) : null;
  }

  async failures(id) {
    const rows = await this.database.query(
      'SELECT `row_number`, sku, error_codes, reasons, row_data FROM product_import_failures WHERE import_id = ? ORDER BY `row_number`',
      [id],
    );
    return rows.map((row) => ({
      rowNumber: Number(row.row_number), sku: row.sku || '', errorCodes: parseJson(row.error_codes),
      reasons: parseJson(row.reasons), source: parseJson(row.row_data, {}),
    }));
  }
}
