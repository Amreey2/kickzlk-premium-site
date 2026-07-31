import AppError from '../utils/AppError.js';

export const createUploadController = (service) => ({
  productImages: async (request, response) => {
    if (!request.files?.length) throw new AppError('At least one product image is required.', 422, 'NO_IMAGES');
    response.status(201).json({ success: true, data: service.serializeUploads(request.files) });
  },
});
