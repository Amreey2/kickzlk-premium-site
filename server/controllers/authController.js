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
  adminLogin: async (request, response) => {
    const result = await service.adminLogin(request.body);
    response.cookie('admin_token', result.token, cookie(8 * 60 * 60 * 1000));
    response.json({ success: true, data: result });
  },
});
