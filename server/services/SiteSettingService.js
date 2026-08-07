import AppError from '../utils/AppError.js';

const validImage = (value) => {
  if (String(value).startsWith('/uploads/')) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
};

export default class SiteSettingService {
  constructor(model) { this.model = model; }

  async sizeGuide() {
    return (await this.model.get('size_guide')) || { imageUrl: '', altText: 'KICKZ.LK global sneaker size guide', updatedAt: null };
  }

  async updateSizeGuide(payload) {
    const imageUrl = String(payload.imageUrl || '').trim();
    const altText = String(payload.altText || 'KICKZ.LK global sneaker size guide').trim();
    if (!imageUrl || !validImage(imageUrl)) throw new AppError('Upload a valid size guide image.', 422, 'INVALID_SIZE_GUIDE_IMAGE');
    if (imageUrl.length > 500 || altText.length > 255) throw new AppError('Size guide details exceed the allowed length.', 422, 'INVALID_SIZE_GUIDE');
    return this.model.set('size_guide', { imageUrl, altText });
  }
}
