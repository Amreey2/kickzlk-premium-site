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

  async findById(id) {
    const rows = await this.database.query('SELECT id, kind, value, status FROM catalog_options WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  }

  async update(id, data) {
    const current = await this.findById(id);
    const column = { type: 'type', gender: 'gender', collection: 'collection' }[current.kind];
    if (current.value !== data.value) await this.database.query(`UPDATE categories SET ${column} = ? WHERE ${column} = ?`, [data.value, current.value]);
    await this.database.query('UPDATE catalog_options SET value = ?, status = ? WHERE id = ?', [data.value, data.status, id]);
    return this.findById(id);
  }
}
