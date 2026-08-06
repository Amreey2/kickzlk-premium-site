import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import { productImportsApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';

const formatDate = (value) => value ? new Date(value).toLocaleString('en-LK') : '—';

export default function AdminProductImportPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const loadHistory = async () => {
    try { setHistory(await productImportsApi.history()); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Import history could not be loaded.'); }
  };
  useEffect(() => {
    let active = true;
    productImportsApi.history().then((items) => { if (active) setHistory(items); }, (requestError) => {
      if (active && !handleAdminSessionError(requestError)) setError(requestError.message || 'Import history could not be loaded.');
    });
    return () => { active = false; };
  }, []);

  const selectFile = (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected); setPreview(null); setResult(null); setError('');
  };
  const previewFile = async () => {
    if (!file) return setError('Select a CSV file first.');
    setBusy('Validating CSV…'); setError(''); setResult(null);
    try { setPreview(await productImportsApi.preview(file)); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'CSV could not be validated.'); }
    finally { setBusy(''); }
  };
  const importFile = async () => {
    if (!file || !preview?.canImport) return;
    setBusy('Importing products…'); setError('');
    try { setResult(await productImportsApi.import(file)); setPreview(null); await loadHistory(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'Products could not be imported.'); }
    finally { setBusy(''); }
  };
  const download = async (callback) => {
    setError('');
    try { await callback(); }
    catch (requestError) { if (!handleAdminSessionError(requestError)) setError(requestError.message || 'CSV could not be downloaded.'); }
  };

  return <AdminLayout title="Bulk Product Import">
    <AdminPageHeader eyebrow="CATALOG MANAGEMENT" title="BULK PRODUCT IMPORT" copy="Validate product CSV data before creating new catalogue records or updating products by SKU." action={<button className="btn btn--ghost" type="button" onClick={() => download(productImportsApi.downloadTemplate)}>DOWNLOAD CSV TEMPLATE</button>} />

    <section className="admin-panel admin-import-panel">
      {error && <p className="admin-feedback admin-feedback--error" role="alert">{error}</p>}
      <div className="admin-form-section__head"><span>01</span><div><strong>SELECT PRODUCT CSV</strong><p>Use the current KICKZ.LK template. Brands and categories must already exist and be active.</p></div></div>
      <label className="admin-upload admin-import-upload"><input key={file ? `${file.name}-${file.lastModified}` : 'empty'} type="file" accept=".csv,text/csv" onChange={selectFile} disabled={Boolean(busy)} /><span>＋</span><strong>{file ? file.name : 'SELECT CSV FILE'}</strong><small>{file ? `${Math.ceil(file.size / 1024)} KB · Ready to validate` : 'CSV only · Maximum 5 MB · Up to 2,000 product rows'}</small></label>
      <div className="admin-import-actions"><button className="btn btn--acid" type="button" onClick={previewFile} disabled={!file || Boolean(busy)}>{busy || 'PREVIEW & VALIDATE'} <span>→</span></button>{file && <button className="btn btn--ghost" type="button" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>CLEAR</button>}</div>
      {busy && <div className="admin-import-progress" role="status"><span /><strong>{busy}</strong></div>}
    </section>

    {preview && <section className="admin-panel">
      <div className="admin-panel__head"><div><span>VALIDATION SUMMARY</span><h2>PREVIEW BEFORE IMPORT</h2></div><button className="btn btn--acid" type="button" onClick={importFile} disabled={!preview.canImport || Boolean(busy)}>IMPORT {preview.validRows} VALID ROWS <span>→</span></button></div>
      <div className="admin-import-summary"><article><span>TOTAL ROWS</span><strong>{preview.totalRows}</strong></article><article><span>VALID</span><strong>{preview.validRows}</strong></article><article><span>FAILED</span><strong>{preview.failedRows}</strong></article></div>
      <div className="admin-table-wrap"><table className="admin-table admin-import-table"><thead><tr><th>Row</th><th>SKU</th><th>Product</th><th>Brand / Category</th><th>Action</th><th>Validation</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.rowNumber}><td data-label="Row">{row.rowNumber}</td><td data-label="SKU"><strong>{row.sku || '—'}</strong></td><td data-label="Product">{row.productName || '—'}</td><td data-label="Brand / Category">{row.brand || '—'}<small>{row.category || '—'}</small></td><td data-label="Action"><AdminStatusBadge tone={row.action === 'UPDATE' ? 'warning' : 'success'}>{row.action}</AdminStatusBadge></td><td data-label="Validation">{row.errors.length ? <div className="admin-import-errors">{row.errors.map((item) => <span key={`${item.code}-${item.message}`}><strong>{item.code}</strong>{item.message}</span>)}</div> : row.notices.length ? <div className="admin-import-notices">{row.notices.map((item) => <span key={item.code}><strong>{item.code}</strong>{item.message}</span>)}</div> : <AdminStatusBadge tone="success">READY</AdminStatusBadge>}</td></tr>)}</tbody></table></div>
    </section>}

    {result && <section className="admin-panel">
      <div className="admin-panel__head"><div><span>IMPORT COMPLETE</span><h2>RESULT SUMMARY</h2></div>{result.failedRows > 0 && <button className="btn btn--ghost" type="button" onClick={() => download(() => productImportsApi.downloadFailures(result.importId))}>DOWNLOAD FAILED ROWS</button>}</div>
      <div className="admin-import-summary admin-import-summary--result"><article><span>TOTAL</span><strong>{result.totalRows}</strong></article><article><span>CREATED</span><strong>{result.createdRows}</strong></article><article><span>UPDATED</span><strong>{result.updatedRows}</strong></article><article><span>FAILED</span><strong>{result.failedRows}</strong></article></div>
      {result.failures.length > 0 && <div className="admin-import-result-errors">{result.failures.map((failure) => <div key={`${failure.rowNumber}-${failure.sku}`}><strong>ROW {failure.rowNumber} · {failure.sku || 'NO SKU'}</strong><span>{failure.errors.map((item) => `${item.code}: ${item.message}`).join(' | ')}</span></div>)}</div>}
    </section>}

    <section className="admin-panel">
      <div className="admin-panel__head"><div><span>AUDIT TRAIL</span><h2>IMPORT HISTORY</h2></div></div>
      {history.length === 0 ? <div className="admin-data-state">NO PRODUCT IMPORTS YET</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>File</th><th>Imported by</th><th>Date</th><th>Total</th><th>Successful</th><th>Failed</th><th>Report</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td data-label="File"><strong>{item.fileName}</strong><small>{item.createdRows} created · {item.updatedRows} updated</small></td><td data-label="Imported by">{item.adminEmail || `Admin #${item.importedBy}`}</td><td data-label="Date">{formatDate(item.createdAt)}</td><td data-label="Total">{item.totalRows}</td><td data-label="Successful">{item.successfulRows}</td><td data-label="Failed">{item.failedRows}</td><td data-label="Report">{item.failedRows > 0 ? <button className="admin-text-button" type="button" onClick={() => download(() => productImportsApi.downloadFailures(item.id))}>DOWNLOAD CSV</button> : '—'}</td></tr>)}</tbody></table></div>}
    </section>
  </AdminLayout>;
}
