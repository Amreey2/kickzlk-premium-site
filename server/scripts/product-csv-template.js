import ProductImportService from '../services/ProductImportService.js';

const service = new ProductImportService({});
process.stdout.write(`${service.template()}\n`);
