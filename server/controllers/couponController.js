export const createCouponController = (service) => ({
  list: async (request, response) => { void request; response.json({ success: true, data: await service.list() }); },
  create: async (request, response) => response.status(201).json({ success: true, data: await service.create(request.body, request.admin?.sub) }),
  update: async (request, response) => response.json({ success: true, data: await service.update(request.params.id, request.body) }),
  archive: async (request, response) => { await service.archive(request.params.id); response.status(204).send(); },
  validate: async (request, response) => response.json({ success: true, data: await service.validate(request.body) }),
});
