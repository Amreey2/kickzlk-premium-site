import AppError from '../utils/AppError.js';

export const createOrderController = (service) => ({
  create: async (request, response) => response.status(201).json({
    success: true,
    data: await service.create(request.body, request.user?.sub || null),
  }),
  get: async (request, response) => {
    const order = await service.get(request.params.id);
    if (!order) throw new AppError('Order was not found.', 404, 'ORDER_NOT_FOUND');
    if (request.user) {
      if (String(order.user_id) !== String(request.user.sub)) throw new AppError('This order does not belong to the authenticated customer.', 403, 'ORDER_FORBIDDEN');
    } else {
      const email = String(request.query.email || '').trim().toLowerCase();
      const phone = String(request.query.phoneNumber || '').trim();
      if ((!email || email !== String(order.email).toLowerCase()) && (!phone || phone !== String(order.phone_number))) {
        throw new AppError('Guest order verification is required.', 401, 'GUEST_ORDER_VERIFICATION_REQUIRED');
      }
    }
    response.json({ success: true, data: order });
  },
  listForUser: async (request, response) => {
    if (String(request.user.sub) !== String(request.params.userId)) throw new AppError('Customer order access is forbidden.', 403, 'ORDER_FORBIDDEN');
    response.json({ success: true, data: await service.listForUser(request.params.userId) });
  },
  adminList: async (request, response) => response.json({ success: true, data: await service.listAll() }),
  updateStatus: async (request, response) => response.json({
    success: true,
    data: await service.updateStatus(request.params.id, request.body.status, request.body.note),
  }),
});
