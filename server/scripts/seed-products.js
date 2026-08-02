import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as database from '../config/database.js';
import { productSeed, seedAssets } from '../data/productSeed.js';
import ProductModel from '../models/ProductModel.js';
import ProductService from '../services/ProductService.js';

const directory = path.dirname(fileURLToPath(import.meta.url));
const sourceAssets = path.resolve(directory, '../../src/assets');
const targetAssets = path.resolve(directory, '../uploads/seed');
const service = new ProductService(new ProductModel(database));

try {
  await fs.mkdir(targetAssets, { recursive: true });
  await Promise.all(seedAssets.map((filename) => fs.copyFile(
    path.join(sourceAssets, filename),
    path.join(targetAssets, filename),
  )));

  let created = 0;
  let updated = 0;
  for (const product of productSeed) {
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
