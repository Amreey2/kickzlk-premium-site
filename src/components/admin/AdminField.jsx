export default function AdminField({ label, name, value, onChange, type = 'text', as = 'input', options = [], placeholder, required = false, rows = 4 }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {as === 'textarea' ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} required={required} rows={rows} />
      ) : as === 'select' ? (
        <select name={name} value={value} onChange={onChange} required={required}>
          {options.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      ) : (
        <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} required={required} />
      )}
    </label>
  );
}
