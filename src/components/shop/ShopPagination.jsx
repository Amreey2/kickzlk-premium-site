const paginationItems = (total, current) => {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const values = [1, current - 1, current, current + 1, total].filter((value) => value >= 1 && value <= total);
  const unique = [...new Set(values)].sort((a, b) => a - b);
  return unique.flatMap((value, index) => index > 0 && value - unique[index - 1] > 1 ? ['ellipsis', value] : [value]);
};

export default function ShopPagination({ current, total, onChange }) {
  if (total <= 1) return null;
  const hrefFor = (page) => {
    const params = new URLSearchParams(window.location.search);
    if (page > 1) params.set('page', String(page));
    else params.delete('page');
    return `${window.location.pathname}${params.size ? `?${params}` : ''}`;
  };
  const selectPage = (event, page) => { event.preventDefault(); onChange(page); };
  return <nav className="shop-pagination" aria-label="Shop pagination">
    {current > 1 && <a href={hrefFor(current - 1)} className="shop-pagination__direction" onClick={(event) => selectPage(event, current - 1)} aria-label="Previous page">←</a>}
    {paginationItems(total, current).map((item, index) => item === 'ellipsis'
      ? <span key={`ellipsis-${index}`} aria-hidden="true">…</span>
      : <a href={hrefFor(item)} className={item === current ? 'active' : ''} aria-current={item === current ? 'page' : undefined} onClick={(event) => selectPage(event, item)} key={item}>{item}</a>)}
    {current < total && <a href={hrefFor(current + 1)} className="shop-pagination__next" onClick={(event) => selectPage(event, current + 1)}>NEXT <span>→</span></a>}
  </nav>;
}
