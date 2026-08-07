import { env } from '../config/env.js';

const cookie = (maxAge) => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: 'strict',
  maxAge,
  path: '/',
});

export const createAuthController = (service) => ({
  register: async (request, response) => {
    const result = await service.register(request.body);
    response.cookie('customer_token', result.token, cookie(7 * 24 * 60 * 60 * 1000));
    response.status(201).json({ success: true, data: result });
  },
  login: async (request, response) => {
    const result = await service.login(request.body);
    response.cookie('customer_token', result.token, cookie(7 * 24 * 60 * 60 * 1000));
    response.json({ success: true, data: result });
  },
  profile: async (request, response) => {
    response.json({ success: true, data: await service.profile(request.user.sub) });
  },
  updateProfile: async (request, response) => {
    response.json({ success: true, data: await service.updateProfile(request.user.sub, request.body) });
  },
  logout: async (request, response) => {
    void request;
    response.clearCookie('customer_token', cookie(0));
    response.status(204).send();
  },
  addresses: async (request, response) => {
    response.json({ success: true, data: await service.addresses(request.user.sub) });
  },
  createAddress: async (request, response) => {
    response.status(201).json({ success: true, data: await service.createAddress(request.user.sub, request.body) });
  },
  updateAddress: async (request, response) => {
    response.json({ success: true, data: await service.updateAddress(request.user.sub, request.params.id, request.body) });
  },
  deleteAddress: async (request, response) => {
    await service.deleteAddress(request.user.sub, request.params.id);
    response.status(204).send();
  },
  forgotPassword: async (request, response) => {
    response.json({ success: true, data: await service.requestPasswordReset(request.body) });
  },
  resetPassword: async (request, response) => {
    response.json({ success: true, data: await service.resetPassword(request.body) });
  },
  adminLogin: async (request, response) => {
    const result = await service.adminLogin(request.body);
    response.cookie('admin_token', result.token, cookie(8 * 60 * 60 * 1000));
    response.json({ success: true, data: result });
  },
});
