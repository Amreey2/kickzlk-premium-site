import AppError from '../utils/AppError.js';
import { parseCsv, serializeCsv } from '../utils/csv.js';

export const CSV_COLUMNS = [
  'sku', 'brand', 'category', 'product_name', 'price', 'status', 'description', 'stock',
  'delivery_timeline', 'available_sizes', 'pre_order_available', 'product_tags',
  'color_variations', 'cdn_images', 'image_alt_text', 'meta_title', 'meta_description',
];
const requiredColumns = ['sku', 'brand', 'category', 'product_name', 'price', 'status'];
const statuses = new Set(['Active', 'Inactive', 'Out of Stock']);
const trueValues = new Set(['TRUE', 'YES']);
const falseValues = new Set(['FALSE', 'NO', '']);
const skuPattern = /^[A-Z0-9][A-Z0-9_-]{1,99}$/;

const uniqueList = (value) => {
  const source = String(value || '').trim().replace(/^\[/, '').replace(/\]$/, '');
  const seen = new Set();
  return source.split(',').map((item) => item.trim().replace(/^["']|["']$/g, '')).filter((item) => {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const validUrl = (value) => {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};
const slugify = (value) => String(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const issue = (code, message) => ({ code, message });

export default class ProductImportService {
  constructor({ productService, productModel, brandModel, categoryModel, importModel }) {
    this.productService = productService;
    this.productModel = productModel;
    this.brandModel = brandModel;
    this.categoryModel = categoryModel;
    this.importModel = importModel;
  }

  template() {
    return serializeCsv([
      CSV_COLUMNS,
      ['KZ-NIKE-001', 'Nike', 'Lifestyle Sneakers', 'Nike Dunk Low Panda', '45000', 'Active',
        'Authentic Nike Dunk Low Panda sneakers.', '5', '2 Weeks', '40,41,42', 'FALSE',
        'New Arrival,Limited Edition', 'Black,White', 'https://cdn.example.com/front.jpg,https://cdn.example.com/side.jpg',
        'Nike Dunk Low Panda in black and white', 'Nike Dunk Low Panda Sri Lanka', 'Authentic Nike sneakers at KICKZ.LK.'],
    ]);
  }

  async preview(csv, fileName = 'products.csv') {
    const validation = await this.validate(csv);
    return this.resultView('preview', fileName, validation);
  }

  async import(csv, { fileName = 'products.csv', adminId }) {
    const validation = await this.validate(csv);
    const safeFileName = String(fileName || 'products.csv').slice(0, 255);
    const importId = await this.importModel.create({ fileName: safeFileName, importedBy: Number(adminId), totalRows: validation.rows.length });
    const failures = validation.rows.filter((row) => row.errors.length).map((row) => this.failure(row));
    let createdRows = 0; let updatedRows = 0;

    for (const row of validation.rows.filter((item) => !item.errors.length)) {
      try {
        const payload = this.productPayload(row);
        if (row.existing) {
          await this.productService.update(row.existing.id, payload);
          updatedRows += 1;
        } else {
          await this.productService.create(payload);
          createdRows += 1;
        }
      } catch (error) {
        failures.push(this.failure(row, [issue(error.code || 'IMPORT_FAILED', error.message || 'Product import failed.')]));
      }
    }

    const summary = {
      totalRows: validation.rows.length,
      successfulRows: createdRows + updatedRows,
      failedRows: failures.length,
      createdRows,
      updatedRows,
    };
    await this.importModel.addFailures(importId, failures);
    await this.importModel.complete(importId, summary);
    return { mode: 'import', importId, fileName: safeFileName, ...summary, failures: failures.map((failure) => ({ rowNumber: failure.rowNumber, sku: failure.sku, errors: failure.errors })) };
  }

  history() { return this.importModel.list(); }

  async failedReport(id) {
    const history = await this.importModel.findById(id);
    if (!history) throw new AppError('Import history was not found.', 404, 'IMPORT_NOT_FOUND');
    const failures = await this.importModel.failures(id);
    const rows = [
      ['row', 'sku', 'error_code', 'reason', ...CSV_COLUMNS],
      ...failures.map((failure) => [failure.rowNumber, failure.sku, failure.errorCodes.join('|'), failure.reasons.join(' | '),
        ...CSV_COLUMNS.map((column) => failure.source[column] || '')]),
    ];
    return { fileName: `kickz-import-${id}-failed-rows.csv`, csv: serializeCsv(rows) };
  }

  async validate(csv) {
    const parsed = parseCsv(csv);
    if (parsed.length < 2) throw new AppError('CSV must contain a header and at least one product row.', 422, 'EMPTY_CSV');
    if (parsed.length > 2001) throw new AppError('A single import can contain up to 2,000 products.', 422, 'CSV_ROW_LIMIT');
    const headers = parsed[0].map((header) => String(header).trim().toLowerCase());
    const duplicates = headers.filter((header, index) => headers.indexOf(header) !== index);
    const missing = requiredColumns.filter((column) => !headers.includes(column));
    const unsupported = headers.filter((header) => !CSV_COLUMNS.includes(header));
    if (missing.length || unsupported.length || duplicates.length) {
      throw new AppError('CSV columns do not match the KICKZ.LK template.', 422, 'INVALID_CSV_COLUMNS', { missing, unsupported, duplicates });
    }

    const brands = await this.brandModel.list();
    const categories = await this.categoryModel.list();
    const brandMap = new Map(brands.map((brand) => [brand.name.toLowerCase(), brand]));
    const categoryMap = new Map(categories.map((category) => [category.name.toLowerCase(), category]));
    const records = parsed.slice(1).map((values, index) => {
      const source = Object.fromEntries(CSV_COLUMNS.map((column) => [column, '']));
      headers.forEach((header, columnIndex) => { source[header] = String(values[columnIndex] || '').trim(); });
      return {
        rowNumber: index + 2,
        source,
        errors: values.length === headers.length ? [] : [issue('CSV_COLUMN_COUNT', `Expected ${headers.length} columns but found ${values.length}. Quote values that contain commas.`)],
        notices: [],
      };
    });
    const skuCounts = new Map();
    records.forEach((row) => {
      const sku = row.source.sku.toUpperCase();
      skuCounts.set(sku, (skuCounts.get(sku) || 0) + 1);
    });

    for (const row of records) {
      await this.validateRow(row, { brandMap, categoryMap, skuCounts });
    }
    return { rows: records };
  }

  async validateRow(row, { brandMap, categoryMap, skuCounts }) {
    const data = row.source;
    for (const field of requiredColumns) if (!data[field]) row.errors.push(issue('REQUIRED_FIELD', `${field} is required.`));
    row.sku = data.sku.toUpperCase();
    if (data.sku && !skuPattern.test(row.sku)) row.errors.push(issue('INVALID_SKU', 'SKU must contain 2–100 letters, numbers, hyphens, or underscores.'));
    if (data.sku && skuCounts.get(row.sku) > 1) row.errors.push(issue('DUPLICATE_SKU_IN_CSV', 'SKU appears more than once in this CSV.'));

    row.brand = brandMap.get(data.brand.toLowerCase());
    if (data.brand && !row.brand) row.errors.push(issue('BRAND_NOT_FOUND', 'Brand does not exist.'));
    else if (row.brand?.status !== 'Active') row.errors.push(issue('BRAND_INACTIVE', 'Brand is inactive.'));
    row.category = categoryMap.get(data.category.toLowerCase());
    if (data.category && !row.category) row.errors.push(issue('CATEGORY_NOT_FOUND', 'Category does not exist.'));
    else if (row.category?.status !== 'Active') row.errors.push(issue('CATEGORY_INACTIVE', 'Category is inactive.'));

    row.price = Number(data.price);
    if (data.price && (!Number.isFinite(row.price) || row.price < 0)) row.errors.push(issue('INVALID_PRICE', 'Price must be a non-negative number.'));
    row.stock = data.stock === '' ? 0 : Number(data.stock);
    if (!Number.isInteger(row.stock) || row.stock < 0) row.errors.push(issue('INVALID_STOCK', 'Stock must be a non-negative whole number.'));
    if (data.status && !statuses.has(data.status)) row.errors.push(issue('INVALID_STATUS', 'Status must be Active, Inactive, or Out of Stock.'));

    const boolean = data.pre_order_available.toUpperCase();
    if (!trueValues.has(boolean) && !falseValues.has(boolean)) row.errors.push(issue('INVALID_PRE_ORDER', 'Pre-order must be TRUE, FALSE, YES, NO, or empty.'));
    row.preOrder = trueValues.has(boolean);
    row.sizes = uniqueList(data.available_sizes);
    row.tags = uniqueList(data.product_tags);
    row.colors = uniqueList(data.color_variations);
    row.cdnImages = uniqueList(data.cdn_images);
    if (row.tags.some((tag) => tag.length > 60)) row.errors.push(issue('INVALID_PRODUCT_TAGS', 'Tags cannot exceed 60 characters each.'));
    if (row.colors.some((color) => color.length > 60)) row.errors.push(issue('INVALID_COLORS', 'Colours cannot exceed 60 characters each.'));
    if (row.cdnImages.some((url) => !validUrl(url))) row.errors.push(issue('INVALID_IMAGE_URL', 'CDN images must be valid HTTP or HTTPS URLs.'));
    if (data.image_alt_text.length > 255) row.errors.push(issue('INVALID_IMAGE_ALT_TEXT', 'Image alt text cannot exceed 255 characters.'));
    if (data.meta_title.length > 255) row.errors.push(issue('INVALID_META_TITLE', 'Meta title cannot exceed 255 characters.'));
    if (data.meta_description.length > 320) row.errors.push(issue('INVALID_META_DESCRIPTION', 'Meta description cannot exceed 320 characters.'));

    if (data.sku && skuCounts.get(row.sku) === 1) {
      row.existing = await this.productModel.findBySku(row.sku);
      if (row.existing) row.notices.push(issue('SKU_EXISTS', 'Existing product will be updated using SKU.'));
    }
    row.action = row.existing ? 'UPDATE' : 'CREATE';
  }

  productPayload(row) {
    const data = row.source;
    return {
      ...(row.existing ? {} : { slug: `${slugify(data.product_name)}-${slugify(row.sku)}` }),
      sku: row.sku,
      brand: row.brand.name,
      brandId: row.brand.id,
      category: row.category.name,
      categoryId: row.category.id,
      name: data.product_name,
      description: data.description || row.existing?.description || data.product_name,
      price: row.price,
      availability: data.status,
      stock: data.status === 'Out of Stock' ? 0 : row.stock,
      deliveryTime: data.delivery_timeline || null,
      sizes: row.sizes.length ? row.sizes : (row.existing?.sizes?.length ? row.existing.sizes : ['One Size']),
      preOrder: row.preOrder,
      productTags: row.tags,
      colorVariations: row.colors,
      cdnImages: row.cdnImages,
      ...(row.existing ? {} : { images: [] }),
      imageAltText: data.image_alt_text || null,
      metaTitle: data.meta_title || null,
      metaDescription: data.meta_description || null,
    };
  }

  failure(row, errors = row.errors) {
    return { rowNumber: row.rowNumber, sku: row.sku || row.source.sku, errors, source: row.source };
  }

  resultView(mode, fileName, validation) {
    const failedRows = validation.rows.filter((row) => row.errors.length).length;
    return {
      mode,
      fileName,
      totalRows: validation.rows.length,
      validRows: validation.rows.length - failedRows,
      failedRows,
      canImport: validation.rows.length > failedRows,
      rows: validation.rows.map((row) => ({
        rowNumber: row.rowNumber, sku: row.sku, productName: row.source.product_name,
        brand: row.source.brand, category: row.source.category, status: row.source.status,
        action: row.action, errors: row.errors, notices: row.notices,
      })),
    };
  }
}
