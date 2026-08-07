import { useEffect, useState } from 'react';
import AdminField from '../../components/admin/AdminField';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { resolveApiAssetUrl, settingsApi, uploadsApi } from '../../services/api';
import { handleAdminSessionError } from '../../utils/adminSession';

const initialSettings = {
  storeName: 'KICKZ.LK',
  location: 'Colombo, Sri Lanka',
  whatsapp: '+94 70 000 0000',
  instagram: '@kickz.lk',
  tiktok: '@kickz.lk',
  heroMessage: 'AUTHENTIC SNEAKERS. BUILT FOR THE CULTURE.',
  announcement: 'AUTHENTICITY GUARANTEED · ISLANDWIDE DELIVERY · PRE-ORDERS OPEN',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(false);
  const [sizeGuide, setSizeGuide] = useState({ imageUrl: '', altText: 'KICKZ.LK global sneaker size guide' });
  const [sizeGuideMessage, setSizeGuideMessage] = useState('');
  const [sizeGuideError, setSizeGuideError] = useState('');
  const [sizeGuideBusy, setSizeGuideBusy] = useState(false);

  useEffect(() => {
    settingsApi.sizeGuide().then((value) => setSizeGuide(value)).catch((error) => {
      if (!handleAdminSessionError(error)) setSizeGuideError(error.message);
    });
  }, []);
  const updateField = (event) => {
    const { name, value } = event.target;
    setSettings((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
  };

  const uploadSizeGuide = async (event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setSizeGuideError('Use a JPG, PNG, or WebP size guide image.');
    setSizeGuideBusy(true); setSizeGuideError(''); setSizeGuideMessage('');
    try {
      const [uploaded] = await uploadsApi.productImages([file]);
      setSizeGuide((current) => ({ ...current, imageUrl: uploaded.url }));
      setSizeGuideMessage('Image uploaded. Save it to publish the global size guide.');
    } catch (error) {
      if (!handleAdminSessionError(error)) setSizeGuideError(error.message || 'Size guide image could not be uploaded.');
    } finally { setSizeGuideBusy(false); }
  };

  const saveSizeGuide = async () => {
    setSizeGuideBusy(true); setSizeGuideError(''); setSizeGuideMessage('');
    try { setSizeGuide(await settingsApi.updateSizeGuide(sizeGuide)); setSizeGuideMessage('Global size guide published.'); }
    catch (error) { if (!handleAdminSessionError(error)) setSizeGuideError(error.message || 'Size guide could not be saved.'); }
    finally { setSizeGuideBusy(false); }
  };

  return (
    <AdminLayout title="Settings">
      <AdminPageHeader eyebrow="STOREFRONT CONTROL" title="SETTINGS" copy="Configuration placeholders ready for a future persisted settings API." />
      {/* SPRINT 4 SETTINGS: sections mirror future backend domains without changing the public storefront. */}
      <form className="admin-settings" onSubmit={handleSubmit}>
        <section className="admin-panel admin-settings-section"><div><span>01</span><h2>STORE INFORMATION</h2><p>Core public store identity.</p></div><div><AdminField label="STORE NAME" name="storeName" value={settings.storeName} onChange={updateField} /><AdminField label="LOCATION" name="location" value={settings.location} onChange={updateField} /></div></section>
        <section className="admin-panel admin-settings-section"><div><span>02</span><h2>WHATSAPP NUMBER</h2><p>Primary customer enquiry channel.</p></div><div><AdminField label="WHATSAPP" name="whatsapp" value={settings.whatsapp} onChange={updateField} /></div></section>
        <section className="admin-panel admin-settings-section"><div><span>03</span><h2>SOCIAL LINKS</h2><p>Customer-facing culture channels.</p></div><div><AdminField label="INSTAGRAM" name="instagram" value={settings.instagram} onChange={updateField} /><AdminField label="TIKTOK" name="tiktok" value={settings.tiktok} onChange={updateField} /></div></section>
        <section className="admin-panel admin-settings-section"><div><span>04</span><h2>HOMEPAGE SETTINGS</h2><p>Frontend copy placeholders only.</p></div><div><AdminField label="HERO MESSAGE" name="heroMessage" value={settings.heroMessage} onChange={updateField} as="textarea" rows={3} /><AdminField label="ANNOUNCEMENT BAR" name="announcement" value={settings.announcement} onChange={updateField} as="textarea" rows={3} /></div></section>
        <section className="admin-panel admin-settings-section"><div><span>05</span><h2>GLOBAL SIZE GUIDE</h2><p>One guide shared automatically by every sneaker product.</p></div><div className="admin-size-guide">
          {sizeGuide.imageUrl && <figure><img src={resolveApiAssetUrl(sizeGuide.imageUrl)} alt={sizeGuide.altText} /></figure>}
          <label className={`admin-upload admin-upload--compact${sizeGuideBusy ? ' is-uploading' : ''}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadSizeGuide} disabled={sizeGuideBusy} /><span>{sizeGuideBusy ? '↻' : '＋'}</span><strong>{sizeGuide.imageUrl ? 'REPLACE SIZE GUIDE IMAGE' : 'UPLOAD SIZE GUIDE IMAGE'}</strong><small>JPG, PNG or WebP</small></label>
          <AdminField label="IMAGE ALT TEXT" name="sizeGuideAlt" value={sizeGuide.altText || ''} onChange={(event) => setSizeGuide((current) => ({ ...current, altText: event.target.value }))} />
          <button className="btn btn--acid" type="button" onClick={saveSizeGuide} disabled={sizeGuideBusy || !sizeGuide.imageUrl}>PUBLISH SIZE GUIDE <span>→</span></button>
          {sizeGuideMessage && <p className="admin-feedback admin-feedback--success" role="status">{sizeGuideMessage}</p>}
          {sizeGuideError && <p className="admin-feedback admin-feedback--error" role="alert">{sizeGuideError}</p>}
        </div></section>
        <div className="admin-settings-actions"><button className="btn btn--acid" type="submit">SAVE SETTINGS <span>→</span></button>{saved && <p role="status">Settings saved in frontend state. Backend persistence pending.</p>}</div>
      </form>
    </AdminLayout>
  );
}
