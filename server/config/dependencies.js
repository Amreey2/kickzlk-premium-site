import * as database from './database.js';
import AdminModel from '../models/AdminModel.js';
import BrandModel from '../models/BrandModel.js';
import CatalogOptionModel from '../models/CatalogOptionModel.js';
import CategoryModel from '../models/CategoryModel.js';
import CouponModel from '../models/CouponModel.js';
import CustomerAddressModel from '../models/CustomerAddressModel.js';
import OrderModel from '../models/OrderModel.js';
import ProductModel from '../models/ProductModel.js';
import ProductImportModel from '../models/ProductImportModel.js';
import SiteSettingModel from '../models/SiteSettingModel.js';
import PasswordResetModel from '../models/PasswordResetModel.js';
import UserModel from '../models/UserModel.js';
import AuthService from '../services/AuthService.js';
import CatalogService from '../services/CatalogService.js';
import CouponService from '../services/CouponService.js';
import ImageService from '../services/ImageService.js';
import OrderService from '../services/OrderService.js';
import ProductService from '../services/ProductService.js';
import ProductImportService from '../services/ProductImportService.js';
import SiteSettingService from '../services/SiteSettingService.js';
import SeoService from '../services/SeoService.js';
import { env } from './env.js';

const userModel = new UserModel(database);
const adminModel = new AdminModel(database);
const productModel = new ProductModel(database);
const brandModel = new BrandModel(database);
const categoryModel = new CategoryModel(database);
const couponModel = new CouponModel(database);
const optionModel = new CatalogOptionModel(database);
const orderModel = new OrderModel(database);
const importModel = new ProductImportModel(database);
const addressModel = new CustomerAddressModel(database);
const passwordResetModel = new PasswordResetModel(database);
const siteSettingModel = new SiteSettingModel(database);
const siteSettingService = new SiteSettingService(siteSettingModel);
const productService = new ProductService({ productModel, brandModel, categoryModel });
const couponService = new CouponService({ couponModel, productModel, categoryModel });

// Central composition keeps controllers testable and database implementations replaceable.
export const services = {
  authService: new AuthService({ userModel, adminModel, addressModel, passwordResetModel }),
  productService,
  productImportService: new ProductImportService({ productService, productModel, brandModel, categoryModel, importModel }),
  catalogService: new CatalogService({ brandModel, categoryModel, optionModel }),
  couponService,
  orderService: new OrderService({ orderModel, productModel, userModel, siteSettingService, couponService }),
  imageService: new ImageService(),
  siteSettingService,
};
services.seoService = new SeoService({ productService, catalogService: services.catalogService, siteUrl: env.siteUrl });
