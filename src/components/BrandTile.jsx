export default function BrandTile({ brand, index = 0, href, onClick }) {
  const Component = href ? 'a' : 'button';
  const imageMode = brand.displayMode === 'Image' && brand.logoImage;
  return (
    <Component
      className="brand-tile"
      {...(href ? { href, onClick: onClick ? (event) => { event.preventDefault(); onClick(); } : undefined } : { type: 'button', onClick })}
    >
      {imageMode
        ? <img className="brand-tile__image" src={brand.logoImage} alt={`${brand.name} logo`} />
        : <span>{brand.name.toUpperCase()}</span>}
      <small>{String(index + 1).padStart(2, '0')} →</small>
    </Component>
  );
}
