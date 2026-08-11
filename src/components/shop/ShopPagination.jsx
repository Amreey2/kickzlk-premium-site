const paginationItems = (total, current) => {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const values = [1, current - 1, current, current + 1, total].filter((value) => value >= 1 && value <= total);
  const unique = [...new Set(values)].sort((a, b) => a - b);
  return unique.flatMap((value, index) => index > 0 && value - unique[index - 1] > 1 ? ['ellipsis', value] : [value]);
};

export default function ShopPagination({ current, total, onChange }) {
  if (total <= 1) return null;
  return <nav className="shop-pagination" aria-label="Shop pagination">
    {current > 1 && <button type="button" className="shop-pagination__direction" onClick={() => onChange(current - 1)} aria-label="Previous page">←</button>}
    {paginationItems(total, current).map((item, index) => item === 'ellipsis'
      ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
      : <button type="button" className={item === current ? 'active' : ''} aria-current={item === current ? 'page' : undefined} onClick={() => onChange(item)} key={item}>{item}</button>)}
    {current < total && <button type="button" className="shop-pagination__next" onClick={() => onChange(current + 1)}>NEXT <span>→</span></button>}
  </nav>;
}
