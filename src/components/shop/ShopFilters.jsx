const sections = [
  ['brands', 'BRAND'],
  ['sizes', 'EU SIZE'],
  ['genders', 'GENDER'],
  ['activities', 'ACTIVITY'],
  ['colors', 'COLOR'],
];

function Toggle({ checked, onChange }) {
  return <button className={`shop-filter-toggle${checked ? ' is-on' : ''}`} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}><span /></button>;
}

export default function ShopFilters({
  filters,
  options,
  activeCount,
  priceError,
  onToggleValue,
  onChange,
  onClear,
  onClose,
  mobile = false,
}) {
  return <div className={`shop-filters${mobile ? ' shop-filters--mobile' : ''}`}>
    <header className="shop-filters__header">
      <div><span className="section-kicker">REFINE THE ROTATION</span><h2>FILTERS</h2></div>
      {mobile && <button type="button" aria-label="Close filters" onClick={onClose}>×</button>}
    </header>
    <div className="shop-filters__body"><div className="shop-filter-sale">
      <div><strong>ON SALE</strong><small>Discounted pairs only</small></div>
      <Toggle checked={filters.onSale} onChange={(value) => onChange('onSale', value)} />
    </div>
    <details className="shop-filter-group" open>
      <summary>PRICE <span>⌄</span></summary>
      <div className="shop-price-fields">
        <label>MINIMUM PRICE<span><b>LKR</b><input type="number" min="0" inputMode="numeric" value={filters.minPrice} placeholder="0" onChange={(event) => onChange('minPrice', event.target.value)} /></span></label>
        <label>MAXIMUM PRICE<span><b>LKR</b><input type="number" min="0" inputMode="numeric" value={filters.maxPrice} placeholder="No limit" onChange={(event) => onChange('maxPrice', event.target.value)} /></span></label>
        {priceError && <p role="alert">{priceError}</p>}
      </div>
    </details>
    {sections.map(([key, label]) => <details className="shop-filter-group" key={key}>
      <summary>{label}{filters[key].length > 0 ? ` (${filters[key].length})` : ''} <span>⌄</span></summary>
      <div className="shop-filter-options">
        {options[key].length === 0 && <small>No options available</small>}
        {options[key].map((option) => <label key={option.value}>
          <input type="checkbox" checked={filters[key].includes(option.value)} onChange={() => onToggleValue(key, option.value)} />
          <span>{option.label}</span><small>{option.count}</small>
        </label>)}
      </div>
    </details>)}</div>
    <footer>
      <button className="shop-filter-clear" type="button" onClick={onClear} disabled={activeCount === 0}>CLEAR ALL{activeCount > 0 ? ` (${activeCount})` : ''}</button>
      {mobile && <button className="btn btn--primary" type="button" onClick={onClose}>VIEW RESULTS <span>→</span></button>}
    </footer>
  </div>;
}
