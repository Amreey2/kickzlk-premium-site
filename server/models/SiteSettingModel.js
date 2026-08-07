const parse = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

export default class SiteSettingModel {
  constructor(database) { this.database = database; }

  async get(key) {
    const rows = await this.database.query('SELECT setting_value, updated_at FROM site_settings WHERE setting_key = ? LIMIT 1', [key]);
    return rows[0] ? { ...parse(rows[0].setting_value), updatedAt: rows[0].updated_at } : null;
  }

  async set(key, value) {
    await this.database.query(
      `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
      [key, JSON.stringify(value)],
    );
    return this.get(key);
  }
}
