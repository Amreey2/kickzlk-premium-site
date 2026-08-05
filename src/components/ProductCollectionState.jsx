export default function ProductCollectionState({ loading, error, empty = false }) {
  if (!loading && !error && !empty) return null;

  return (
    <div className="product-collection-state" role="status">
      <span className="section-kicker">KICKZ.LK CATALOG</span>
      <strong>{loading ? 'LOADING CURATED PAIRS…' : error ? 'CATALOG TEMPORARILY UNAVAILABLE' : 'NO PAIRS FOUND'}</strong>
      {error && <p>Please refresh or try again shortly.</p>}
    </div>
  );
}
