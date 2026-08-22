const escapeXml = (value) => String(value).replace(/[<>&'"]/g, (character) => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[character]));

const slugify = (value) => String(value || '').toLowerCase().normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const isoDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export default class SeoService {
  constructor({ productService, catalogService, siteUrl }) {
    this.productService = productService;
    this.catalogService = catalogService;
    this.siteUrl = String(siteUrl).replace(/\/$/, '');
  }

  robots() {
    return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /login\nDisallow: /register\nDisallow: /forgot-password\nDisallow: /reset-password\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order-confirmation\nDisallow: /track-order\nDisallow: /*?search=\nDisallow: /*?*search=\nSitemap: ${this.siteUrl}/sitemap.xml\n`;
  }

  async sitemap() {
    const [products, brands, categories] = await Promise.all([
      this.productService.listPublic({}),
      this.catalogService.listBrands(true),
      this.catalogService.listCategories(true),
    ]);
    const urls = [
      ...['/', '/shop', '/new-drops', '/categories', '/brands', '/about', '/contact'].map((path) => ({ path })),
      ...products.filter((product) => brands.some((brand) => brand.name === product.brand)
        && categories.some((category) => category.name === product.category))
        .map((product) => ({ path: `/product/${product.id}`, updatedAt: product.updatedAt || product.createdAt })),
      ...brands.map((brand) => ({ path: `/brand/${slugify(brand.name)}`, updatedAt: brand.updatedAt || brand.createdAt })),
      ...categories.map((category) => ({ path: `/category/${slugify(category.name)}`, updatedAt: category.updatedAt || category.createdAt })),
    ];
    const seen = new Set();
    const entries = urls.filter(({ path }) => {
      if (!path || seen.has(path)) return false;
      seen.add(path); return true;
    }).map(({ path, updatedAt }) => {
      const lastmod = isoDate(updatedAt);
      return `  <url>\n    <loc>${escapeXml(`${this.siteUrl}${path}`)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`;
    }).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
  }
}
