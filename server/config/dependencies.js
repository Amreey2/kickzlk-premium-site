import * as database from './database.js';
import AdminModel from '../models/AdminModel.js';
import BrandModel from '../models/BrandModel.js';
import CatalogOptionModel from '../models/CatalogOptionModel.js';
import CategoryModel from '../models/CategoryModel.js';
import CustomerAddressModel from '../models/CustomerAddressModel.js';
import OrderModel from '../models/OrderModel.js';
import ProductModel from '../models/ProductModel.js';
import ProductImportModel from '../models/ProductImportModel.js';
import PasswordResetModel from '../models/PasswordResetModel.js';
import UserModel from '../models/UserModel.js';
import AuthService from '../services/AuthService.js';
import CatalogService from '../services/CatalogService.js';
import ImageService from '../services/ImageService.js';
import OrderService from '../services/OrderService.js';
import ProductService from '../services/ProductService.js';
import ProductImportService from '../services/ProductImportService.js';

const userModel = new UserModel(database);
const adminModel = new AdminModel(database);
const productModel = new ProductModel(database);
const brandModel = new BrandModel(database);
const categoryModel = new CategoryModel(database);
const optionModel = new CatalogOptionModel(database);
const orderModel = new OrderModel(database);
const importModel = new ProductImportModel(database);
const addressModel = new CustomerAddressModel(database);
const passwordResetModel = new PasswordResetModel(database);
const productService = new ProductService({ productModel, brandModel, categoryModel });

// Central composition keeps controllers testable and database implementations replaceable.
export const services = {
  authService: new AuthService({ userModel, adminModel, addressModel, passwordResetModel }),
  productService,
  productImportService: new ProductImportService({ productService, productModel, brandModel, categoryModel, importModel }),
  catalogService: new CatalogService({ brandModel, categoryModel, optionModel }),
  orderService: new OrderService({ orderModel, productModel }),
  imageService: new ImageService(),
};
