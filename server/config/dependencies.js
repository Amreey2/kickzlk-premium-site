import * as database from './database.js';
import AdminModel from '../models/AdminModel.js';
import OrderModel from '../models/OrderModel.js';
import ProductModel from '../models/ProductModel.js';
import UserModel from '../models/UserModel.js';
import AuthService from '../services/AuthService.js';
import ImageService from '../services/ImageService.js';
import OrderService from '../services/OrderService.js';
import ProductService from '../services/ProductService.js';

const userModel = new UserModel(database);
const adminModel = new AdminModel(database);
const productModel = new ProductModel(database);
const orderModel = new OrderModel(database);

// Central composition keeps controllers testable and database implementations replaceable.
export const services = {
  authService: new AuthService({ userModel, adminModel }),
  productService: new ProductService(productModel),
  orderService: new OrderService({ orderModel, productModel }),
  imageService: new ImageService(),
};
