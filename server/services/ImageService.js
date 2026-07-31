export default class ImageService {
  // Controllers depend on this adapter rather than disk details, allowing cloud storage later.
  serializeUploads(files = []) {
    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
    }));
  }
}
