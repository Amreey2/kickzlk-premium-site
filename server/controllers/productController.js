export const createProductController = (service) => ({
  list: async (request, response) => response.json({
    success: true,
    data: await service.list({
      category: request.query.category,
      brand: request.query.brand,
      productType: request.query.productType,
      search: request.query.search,
    }),
  }),
  get: async (request, response) => response.json({ success: true, data: await service.get(request.params.id) }),
  create: async (request, response) => response.status(201).json({ success: true, data: await service.create(request.body) }),
  update: async (request, response) => response.json({ success: true, data: await service.update(request.params.id, request.body) }),
  delete: async (request, response) => {
    await service.delete(request.params.id);
    response.status(204).send();
  },
});
