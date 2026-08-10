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

  async paymentSettings() {
    return (await this.model.get('payment_settings')) || {
      methodName: 'Bank Transfer', bankName: 'Configure in Admin Settings', accountName: 'KICKZ.LK',
      accountNumber: 'Configure in Admin Settings', branch: 'Configure in Admin Settings',
      instructions: 'Use your order number as the transfer reference.', advancePercentage: 50, updatedAt: null,
    };
  }

  async updatePaymentSettings(payload) {
    const clean = {
      methodName: String(payload.methodName || 'Bank Transfer').trim(),
      bankName: String(payload.bankName || '').trim(), accountName: String(payload.accountName || '').trim(),
      accountNumber: String(payload.accountNumber || '').trim(), branch: String(payload.branch || '').trim(),
      instructions: String(payload.instructions || '').trim(), advancePercentage: Number(payload.advancePercentage),
    };
    if (!clean.bankName || !clean.accountName || !clean.accountNumber || !clean.branch) throw new AppError('Complete all required bank details.', 422, 'INVALID_PAYMENT_SETTINGS');
    if (Object.values(clean).some((value) => String(value).length > 500)) throw new AppError('Payment settings exceed the allowed length.', 422, 'INVALID_PAYMENT_SETTINGS');
    if (!Number.isFinite(clean.advancePercentage) || clean.advancePercentage < 0 || clean.advancePercentage > 100) throw new AppError('Advance percentage must be between 0 and 100.', 422, 'INVALID_ADVANCE_PERCENTAGE');
    return this.model.set('payment_settings', clean);
  }

  async homepageMedia() {
    const value = (await this.model.get('homepage_media')) || { items: [], updatedAt: null };
    return { ...value, items: (value.items || []).filter((item) => item.status === 'Active').sort((a, b) => a.sortOrder - b.sortOrder) };
  }

  async adminHomepageMedia() {
    return (await this.model.get('homepage_media')) || { items: [], updatedAt: null };
  }

  async updateHomepageMedia(payload) {
    if (!Array.isArray(payload.items) || payload.items.length > 12) throw new AppError('Homepage media must contain no more than 12 items.', 422, 'INVALID_HOMEPAGE_MEDIA');
    const items = payload.items.map((item, index) => {
      const type = item.type === 'video' ? 'video' : 'image';
      const url = String(item.url || '').trim();
      const title = String(item.title || '').trim();
      const status = item.status === 'Inactive' ? 'Inactive' : 'Active';
      if (!url || !validImage(url)) throw new AppError(`Media item ${index + 1} requires a valid upload or HTTPS URL.`, 422, 'INVALID_MEDIA_URL');
      if (url.length > 500 || title.length > 120) throw new AppError('Homepage media details exceed the allowed length.', 422, 'INVALID_HOMEPAGE_MEDIA');
      return { id: String(item.id || `media-${Date.now()}-${index}`), type, url, title, status, sortOrder: Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : index };
    });
    return this.model.set('homepage_media', { items });
  }
}
