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
  const [payment, setPayment] = useState({ methodName: 'Bank Transfer', bankName: '', accountName: '', accountNumber: '', branch: '', instructions: '', advancePercentage: 50 });
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [mediaItems, setMediaItems] = useState([]);
  const [mediaMessage, setMediaMessage] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [mediaBusy, setMediaBusy] = useState(false);

  useEffect(() => {
    settingsApi.sizeGuide().then((value) => setSizeGuide(value)).catch((error) => {
      if (!handleAdminSessionError(error)) setSizeGuideError(error.message);
    });
  }, []);
  useEffect(() => { settingsApi.paymentSettings().then(setPayment).catch((error) => { if (!handleAdminSessionError(error)) setPaymentError(error.message); }); }, []);
  useEffect(() => { settingsApi.adminHomepageMedia().then((value) => setMediaItems(value.items || [])).catch((error) => { if (!handleAdminSessionError(error)) setMediaError(error.message); }); }, []);
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

  const savePayment = async () => { setPaymentBusy(true); setPaymentMessage(''); setPaymentError(''); try { setPayment(await settingsApi.updatePaymentSettings(payment)); setPaymentMessage('Bank-transfer settings published.'); } catch (error) { if (!handleAdminSessionError(error)) setPaymentError(error.message); } finally { setPaymentBusy(false); } };
  const updateMedia = (index, field, value) => setMediaItems((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  const uploadMediaImage = async (index, event) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setMediaBusy(true); setMediaError('');
    try { const [uploaded] = await uploadsApi.productImages([file]); updateMedia(index, 'url', uploaded.url); }
    catch (error) { if (!handleAdminSessionError(error)) setMediaError(error.message); }
    finally { setMediaBusy(false); }
  };
  const saveMedia = async () => { setMediaBusy(true); setMediaMessage(''); setMediaError(''); try { const value = await settingsApi.updateHomepageMedia(mediaItems); setMediaItems(value.items || []); setMediaMessage('Homepage media published.'); } catch (error) { if (!handleAdminSessionError(error)) setMediaError(error.message); } finally { setMediaBusy(false); } };

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
        <section className="admin-panel admin-settings-section"><div><span>06</span><h2>BANK TRANSFER</h2><p>Public checkout payment details and centrally managed advance percentage.</p></div><div className="admin-size-guide">
          <AdminField label="PAYMENT METHOD NAME" name="methodName" value={payment.methodName || ''} onChange={(event) => setPayment((value) => ({ ...value, methodName: event.target.value }))} />
          <AdminField label="BANK NAME" name="bankName" value={payment.bankName || ''} onChange={(event) => setPayment((value) => ({ ...value, bankName: event.target.value }))} />
          <AdminField label="ACCOUNT NAME" name="accountName" value={payment.accountName || ''} onChange={(event) => setPayment((value) => ({ ...value, accountName: event.target.value }))} />
          <AdminField label="ACCOUNT NUMBER" name="accountNumber" value={payment.accountNumber || ''} onChange={(event) => setPayment((value) => ({ ...value, accountNumber: event.target.value }))} />
          <AdminField label="BRANCH" name="branch" value={payment.branch || ''} onChange={(event) => setPayment((value) => ({ ...value, branch: event.target.value }))} />
          <AdminField label="PAYMENT INSTRUCTIONS" name="instructions" value={payment.instructions || ''} onChange={(event) => setPayment((value) => ({ ...value, instructions: event.target.value }))} as="textarea" rows={3} />
          <AdminField label="ADVANCE PERCENTAGE" name="advancePercentage" value={String(payment.advancePercentage ?? 50)} onChange={(event) => setPayment((value) => ({ ...value, advancePercentage: Number(event.target.value) }))} type="number" />
          <button className="btn btn--acid" type="button" onClick={savePayment} disabled={paymentBusy}>PUBLISH PAYMENT DETAILS <span>→</span></button>{paymentMessage && <p className="admin-feedback admin-feedback--success">{paymentMessage}</p>}{paymentError && <p className="admin-feedback admin-feedback--error">{paymentError}</p>}
        </div></section>
        <section className="admin-panel admin-settings-section"><div><span>07</span><h2>HOMEPAGE MEDIA</h2><p>Manage unboxings, customer content and behind-the-scenes visuals. Images can be uploaded; images and videos can also use CDN URLs.</p></div><div className="admin-media-manager">
          {mediaItems.map((item, index) => <article className="admin-media-item" key={item.id || index}><div className="admin-media-item__head"><strong>MEDIA {String(index + 1).padStart(2, '0')}</strong><button type="button" onClick={() => setMediaItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}>REMOVE</button></div><div className="admin-form-grid"><AdminField label="TYPE" name={`mediaType${index}`} value={item.type || 'image'} onChange={(event) => updateMedia(index, 'type', event.target.value)} as="select" options={['image', 'video']} /><AdminField label="STATUS" name={`mediaStatus${index}`} value={item.status || 'Active'} onChange={(event) => updateMedia(index, 'status', event.target.value)} as="select" options={['Active', 'Inactive']} /><AdminField label="TITLE / CAPTION" name={`mediaTitle${index}`} value={item.title || ''} onChange={(event) => updateMedia(index, 'title', event.target.value)} /><AdminField label="SORT ORDER" name={`mediaSort${index}`} value={String(item.sortOrder ?? index)} onChange={(event) => updateMedia(index, 'sortOrder', Number(event.target.value))} type="number" /></div><AdminField label="UPLOAD OR CDN URL" name={`mediaUrl${index}`} value={item.url || ''} onChange={(event) => updateMedia(index, 'url', event.target.value)} placeholder="/uploads/media.jpg or https://…" />{item.type !== 'video' && <label className="admin-upload admin-upload--compact"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadMediaImage(index, event)} disabled={mediaBusy} /><span>＋</span><strong>UPLOAD IMAGE</strong><small>JPG, PNG or WebP</small></label>}</article>)}
          <div className="admin-media-actions"><button className="btn btn--ghost" type="button" onClick={() => setMediaItems((items) => [...items, { id: `media-${Date.now()}`, type: 'image', url: '', title: '', status: 'Active', sortOrder: items.length }])} disabled={mediaItems.length >= 12}>ADD MEDIA</button><button className="btn btn--acid" type="button" onClick={saveMedia} disabled={mediaBusy}>PUBLISH MEDIA <span>→</span></button></div>{mediaMessage && <p className="admin-feedback admin-feedback--success">{mediaMessage}</p>}{mediaError && <p className="admin-feedback admin-feedback--error">{mediaError}</p>}
        </div></section>
        <div className="admin-settings-actions"><button className="btn btn--acid" type="submit">SAVE SETTINGS <span>→</span></button>{saved && <p role="status">Settings saved in frontend state. Backend persistence pending.</p>}</div>
      </form>
    </AdminLayout>
  );
}
