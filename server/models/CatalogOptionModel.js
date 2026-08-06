export default class CatalogOptionModel {
  constructor(database) { this.database = database; }

  async list({ activeOnly = false } = {}) {
    return this.database.query(`SELECT id, kind, value, status FROM catalog_options${activeOnly ? " WHERE status = 'Active'" : ''} ORDER BY kind, value`);
  }

  async find(kind, value) {
    const rows = await this.database.query('SELECT id, kind, value, status FROM catalog_options WHERE kind = ? AND value = ? LIMIT 1', [kind, value]);
    return rows[0] || null;
  }

  async create(data) {
    const result = await this.database.query('INSERT INTO catalog_options (kind, value, status) VALUES (?, ?, ?)', [data.kind, data.value, data.status]);
    return { id: Number(result.insertId), ...data };
  }
}
