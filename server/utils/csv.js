import AppError from './AppError.js';

export const parseCsv = (input) => {
  const text = String(input || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = []; let field = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { row.push(field); field = ''; }
    else if (character === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (character !== '\r') field += character;
  }
  if (quoted) throw new AppError('CSV contains an unclosed quoted field.', 422, 'INVALID_CSV');
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((values) => values.some((value) => String(value).trim() !== ''));
};

const escape = (value) => {
  const string = String(value ?? '');
  return /[",\r\n]/.test(string) ? `"${string.replace(/"/g, '""')}"` : string;
};

export const serializeCsv = (rows) => rows.map((row) => row.map(escape).join(',')).join('\r\n');
