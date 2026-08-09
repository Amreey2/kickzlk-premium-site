import fs from 'node:fs/promises';
import path from 'node:path';
import * as database from '../config/database.js';
import BrandModel from '../models/BrandModel.js';
import CategoryModel from '../models/CategoryModel.js';
import ProductImportModel from '../models/ProductImportModel.js';
import ProductModel from '../models/ProductModel.js';
import ProductImportService from '../services/ProductImportService.js';
import ProductService from '../services/ProductService.js';

const usage = () => {
  console.log('Usage: npm run csv:preview -- <products.csv>');
  console.log('       npm run csv:import -- <products.csv>');
};

const args = process.argv.slice(2);
const filePath = args.find((arg) => !arg.startsWith('--'));
const mode = args.includes('--import') ? 'import' : 'preview';

if (!filePath) {
  usage();
  process.exit(1);
}

const productModel = new ProductModel(database);
const brandModel = new BrandModel(database);
const categoryModel = new CategoryModel(database);
const productService = new ProductService({ productModel, brandModel, categoryModel });
const importModel = new ProductImportModel(database);
const service = new ProductImportService({ productService, productModel, brandModel, categoryModel, importModel });

try {
  const csv = await fs.readFile(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const result = mode === 'import'
    ? await service.import(csv, { fileName, adminId: null })
    : await service.preview(csv, fileName);

  console.log(`${mode === 'import' ? 'Import' : 'Preview'} complete for ${result.fileName}`);
  console.log(`Total rows: ${result.totalRows}`);
  if (mode === 'import') {
    console.log(`Successful rows: ${result.successfulRows}`);
    console.log(`Created rows: ${result.createdRows}`);
    console.log(`Updated rows: ${result.updatedRows}`);
  } else {
    console.log(`Valid rows: ${result.validRows}`);
  }
  console.log(`Failed rows: ${result.failedRows}`);

  const failedRows = result.rows?.filter((row) => row.errors.length) || result.failures || [];
  if (failedRows.length) {
    console.log('\nFailures:');
    for (const row of failedRows.slice(0, 20)) {
      const errors = row.errors.map((error) => `${error.code}: ${error.message}`).join('; ');
      console.log(`Row ${row.rowNumber}${row.sku ? ` (${row.sku})` : ''}: ${errors}`);
    }
    if (failedRows.length > 20) console.log(`...and ${failedRows.length - 20} more failure(s).`);
  }
} finally {
  await database.closeDatabase();
}
