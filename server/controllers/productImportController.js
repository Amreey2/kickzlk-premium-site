import AppError from '../utils/AppError.js';

export const createProductImportController = (service) => ({
  template: async (request, response) => {
    void request;
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', 'attachment; filename="kickz-product-import-template.csv"');
    response.send(service.template());
  },
  process: async (request, response) => {
    if (!request.file?.buffer) throw new AppError('Select a CSV file to continue.', 422, 'CSV_REQUIRED');
    const csv = request.file.buffer.toString('utf8');
    const mode = request.body.mode || 'preview';
    if (!['preview', 'import'].includes(mode)) throw new AppError('Import mode must be preview or import.', 422, 'INVALID_IMPORT_MODE');
    const result = mode === 'preview'
      ? await service.preview(csv, request.file.originalname)
      : await service.import(csv, { fileName: request.file.originalname, adminId: request.admin.sub });
    response.status(mode === 'import' ? 201 : 200).json({ success: true, data: result });
  },
  history: async (request, response) => { void request; response.json({ success: true, data: await service.history() }); },
  failedReport: async (request, response) => {
    const report = await service.failedReport(request.params.id);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    response.send(report.csv);
  },
});
