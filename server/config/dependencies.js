import * as database from './database.js';
import AdminModel from '../models/AdminModel.js';
import BrandModel from '../models/BrandModel.js';
import CatalogOptionModel from '../models/CatalogOptionModel.js';
import CategoryModel from '../models/CategoryModel.js';
import OrderModel from '../models/OrderModel.js';
import ProductModel from '../models/ProductModel.js';
import UserModel from '../models/UserModel.js';
import AuthService from '../services/AuthService.js';
import CatalogService from '../services/CatalogService.js';
import ImageService from '../services/ImageService.js';
import OrderService from '../services/OrderService.js';
import ProductService from '../services/ProductService.js';

const userModel = new UserModel(database);
const adminModel = new AdminModel(database);
const productModel = new ProductModel(database);
const brandModel = new BrandModel(database);
const categoryModel = new CategoryModel(database);
const optionModel = new CatalogOptionModel(database);
const orderModel = new OrderModel(database);

// Central composition keeps controllers testable and database implementations replaceable.
export const services = {
  authService: new AuthService({ userModel, adminModel }),
  productService: new ProductService({ productModel, brandModel, categoryModel }),
  catalogService: new CatalogService({ brandModel, categoryModel, optionModel }),
  orderService: new OrderService({ orderModel, productModel }),
  imageService: new ImageService(),
};
