import { useState } from 'react';
import AdminField from '../../components/admin/AdminField';
import AdminLayout from '../../components/admin/AdminLayout';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

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
  const updateField = (event) => {
    const { name, value } = event.target;
    setSettings((current) => ({ ...current, [name]: value }));
    setSaved(false);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSaved(true);
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
        <div className="admin-settings-actions"><button className="btn btn--acid" type="submit">SAVE SETTINGS <span>→</span></button>{saved && <p role="status">Settings saved in frontend state. Backend persistence pending.</p>}</div>
      </form>
    </AdminLayout>
  );
}
