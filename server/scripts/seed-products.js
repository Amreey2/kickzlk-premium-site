import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as database from '../config/database.js';
import { productSeed, seedAssets } from '../data/productSeed.js';
import ProductModel from '../models/ProductModel.js';
import BrandModel from '../models/BrandModel.js';
import CategoryModel from '../models/CategoryModel.js';
import ProductService from '../services/ProductService.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourceAssets = path.resolve(directory, '../../src/assets');
const targetAssets = path.resolve(directory, '../uploads/seed');
const productModel = new ProductModel(database);
const brandModel = new BrandModel(database);
const categoryModel = new CategoryModel(database);
const service = new ProductService({ productModel, brandModel, categoryModel });

try {
  await fs.mkdir(targetAssets, { recursive: true });
  await Promise.all(seedAssets.map((filename) => fs.copyFile(
    path.join(sourceAssets, filename),
    path.join(targetAssets, filename),
  )));

  let created = 0;
  let updated = 0;
  for (const [index, sourceProduct] of productSeed.entries()) {
    const brand = await brandModel.findByName(sourceProduct.brand);
    let category = await categoryModel.findByName(sourceProduct.category);
    if (!category) category = await categoryModel.create({
      name: sourceProduct.category, status: 'Active', metaTitle: sourceProduct.category,
      metaDescription: `Shop ${sourceProduct.category} at KICKZ.LK.`, image: null, type: null, gender: null, collection: null,
    });
    const product = {
      ...sourceProduct,
      sku: `KZ-SEED-${String(index + 1).padStart(4, '0')}`,
      brandId: brand.id,
      categoryId: category.id,
      metaTitle: sourceProduct.name,
      metaDescription: sourceProduct.description,
      productTags: [sourceProduct.productTag],
      colorVariations: sourceProduct.variations.map((variation) => variation.colorway),
      cdnImages: [],
    };
    const existing = await service.get(product.slug).catch((error) => error.code === 'PRODUCT_NOT_FOUND' ? null : Promise.reject(error));
    if (existing) {
      await service.update(product.slug, product);
      updated += 1;
    } else {
      await service.create(product);
      created += 1;
    }
  }
  console.log(`Product seed complete: ${created} created, ${updated} updated.`);
} finally {
  await database.closeDatabase();
}
