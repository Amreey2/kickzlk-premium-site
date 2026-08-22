import AppError from '../utils/AppError.js';

export const createOrderController = (service) => ({
  quote: async (request, response) => response.json({ success: true, data: await service.quote(request.body, request.user?.sub || null) }),
  create: async (request, response) => response.status(201).json({
    success: true,
    data: await service.create(request.body, request.user?.sub || null),
  }),
  get: async (request, response) => {
    const order = await service.get(request.params.id);
    const guestLookupFailed = () => new AppError('Order number or checkout email could not be verified.', 404, 'ORDER_NOT_FOUND');
    if (!order) throw request.user ? new AppError('Order was not found.', 404, 'ORDER_NOT_FOUND') : guestLookupFailed();
    if (request.user) {
      if (String(order.user_id) !== String(request.user.sub)) throw new AppError('This order does not belong to the authenticated customer.', 403, 'ORDER_FORBIDDEN');
    } else {
      const email = String(request.query.email || '').trim().toLowerCase();
      if (!email || email !== String(order.email).toLowerCase()) {
        throw guestLookupFailed();
      }
    }
    response.json({ success: true, data: order });
  },
  listForUser: async (request, response) => {
    if (String(request.user.sub) !== String(request.params.userId)) throw new AppError('Customer order access is forbidden.', 403, 'ORDER_FORBIDDEN');
    response.json({ success: true, data: await service.listForUser(request.params.userId) });
  },
  adminList: async (request, response) => response.json({ success: true, data: await service.listAll() }),
  adminCustomers: async (request, response) => response.json({ success: true, data: await service.searchCustomers(request.query.q) }),
  adminQuote: async (request, response) => response.json({ success: true, data: await service.adminQuote(request.body) }),
  adminCreate: async (request, response) => response.status(201).json({ success: true, data: await service.adminCreate(request.body) }),
  updateStatus: async (request, response) => response.json({
    success: true,
    data: await service.updateStatus(request.params.id, request.body.status, request.body.note),
  }),
});
