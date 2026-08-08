export const createSiteSettingController = (service) => ({
  sizeGuide: async (request, response) => { void request; response.json({ success: true, data: await service.sizeGuide() }); },
  updateSizeGuide: async (request, response) => response.json({ success: true, data: await service.updateSizeGuide(request.body) }),
  paymentSettings: async (request, response) => { void request; response.json({ success: true, data: await service.paymentSettings() }); },
  updatePaymentSettings: async (request, response) => response.json({ success: true, data: await service.updatePaymentSettings(request.body) }),
});
