import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import type { BuildMod, ModStatus, PartCategory } from '@/types';
import { useAppStore } from '@/store/AppStore';
import { vehicles, vehicleLabel } from '@/data/vehicles';
import { browseCatalogue, categoryOrder } from '@/services/catalogue';
import { statusMeta } from '@/services/builds';
import { IconX, IconPlus, IconWrench } from '@/components/icons';

/** Extra, non-catalogue mod groups a build commonly has. */
const EXTRA_CATEGORIES = ['Protection', 'Recovery', 'Touring', 'Lighting', 'Wheels & Tyres', 'Other'];
const ALL_CATEGORIES = [...categoryOrder, ...EXTRA_CATEGORIES];
const isCatalogueCategory = (c: string): c is PartCategory => (categoryOrder as string[]).includes(c);

let modSeq = 0;

export function CreateBuildModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { createBuild } = useAppStore();

  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [vehicleId, setVehicleId] = useState(vehicles[0].id);
  const [region, setRegion] = useState('QLD');
  const [story, setStory] = useState('');
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>([
    { label: 'Lift', value: '' },
    { label: 'Tyres', value: '' },
  ]);
  const [mods, setMods] = useState<BuildMod[]>([]);

  // Mod composer state
  const [mTitle, setMTitle] = useState('');
  const [mCategory, setMCategory] = useState<string>('Suspension');
  const [mStatus, setMStatus] = useState<ModStatus>('fitted');
  const [mPartId, setMPartId] = useState('');

  // Catalogue parts available to link for the chosen vehicle + category.
  const linkOptions = useMemo(() => {
    if (!isCatalogueCategory(mCategory)) return [];
    const parts = browseCatalogue({ vehicle: { make: vehicles.find((v) => v.id === vehicleId)?.make, model: vehicles.find((v) => v.id === vehicleId)?.model, series: vehicles.find((v) => v.id === vehicleId)?.series ?? vehicles.find((v) => v.id === vehicleId)?.chassis }, category: mCategory });
    return parts.map((p) => ({ id: p.id, label: `${p.partNumber} · ${p.name.split(' — ')[0]}` }));
  }, [mCategory, vehicleId]);

  const addMod = () => {
    if (!mTitle.trim()) return;
    setMods((prev) => [
      ...prev,
      { id: `nm-${modSeq++}`, title: mTitle.trim(), category: mCategory, status: mStatus, partId: mPartId || undefined },
    ]);
    setMTitle('');
    setMPartId('');
  };

  const removeMod = (idx: number) => setMods((prev) => prev.filter((_, i) => i !== idx));

  const canSave = title.trim().length > 1 && mods.length > 0;

  const save = () => {
    if (!canSave) return;
    const build = createBuild({
      title: title.trim(),
      tagline: tagline.trim() || 'A community 4WD build.',
      vehicleId,
      region,
      story: story.trim() || 'No notes added yet.',
      specs: specs.filter((s) => s.value.trim()),
      mods,
    });
    onClose();
    navigate(`/community/${build.id}`);
  };

  const field = 'w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-50 placeholder:text-ink-500 outline-none focus:border-iq-500/70';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="card my-8 w-full max-w-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
          <div>
            <div className="kicker">Community</div>
            <h2 className="font-display text-lg font-bold text-ink-50">Share your build</h2>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-100"><IconX /></button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Rig name *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Red Centre 79" className={field} />
            </div>
            <div>
              <label className="label">Vehicle</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className={field}>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{vehicleLabel(v)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tagline</label>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line about the build" className={field} />
            </div>
            <div>
              <label className="label">Region</label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className={field}>
                {['QLD', 'NSW', 'VIC', 'SA', 'WA', 'NT', 'TAS', 'ACT'].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Lift / Tyres</label>
              <div className="flex gap-2">
                <input value={specs[0].value} onChange={(e) => setSpecs((s) => [{ ...s[0], value: e.target.value }, s[1]])} placeholder="Lift" className={field} />
                <input value={specs[1].value} onChange={(e) => setSpecs((s) => [s[0], { ...s[1], value: e.target.value }])} placeholder="Tyres" className={field} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Owner notes</label>
              <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={2} placeholder="How it's set up and what it's for…" className={field} />
            </div>
          </div>

          {/* Mod composer */}
          <div className="rounded-lg border border-ink-700 bg-ink-900/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-300">
              <IconWrench width={13} height={13} /> Add mods
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
              <input value={mTitle} onChange={(e) => setMTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMod()} placeholder="Mod title e.g. Front shocks" className={field} />
              <select value={mCategory} onChange={(e) => { setMCategory(e.target.value); setMPartId(''); }} className={field}>
                {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={mStatus} onChange={(e) => setMStatus(e.target.value as ModStatus)} className={field}>
                {(['fitted', 'planned', 'wishlist'] as ModStatus[]).map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
              </select>
            </div>
            {isCatalogueCategory(mCategory) && (
              <div className="mt-2">
                <select value={mPartId} onChange={(e) => setMPartId(e.target.value)} className={field}>
                  <option value="">Link a catalogue part (optional) — {linkOptions.length} available</option>
                  {linkOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </div>
            )}
            <button onClick={addMod} disabled={!mTitle.trim()} className="btn-subtle mt-2 w-full disabled:opacity-50">
              <IconPlus width={14} height={14} /> Add mod
            </button>

            {mods.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {mods.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-2 rounded-md border border-ink-700 bg-ink-900 px-2.5 py-1.5 text-sm">
                    <span className="rounded border border-ink-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-400">{m.category}</span>
                    <span className="flex-1 truncate text-ink-100">{m.title}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${statusMeta[m.status].cls}`}>{statusMeta[m.status].label}</span>
                    {m.partId && <span className="text-[10px] font-semibold text-iq-400">linked</span>}
                    <button onClick={() => removeMod(i)} className="text-ink-500 hover:text-signal-red"><IconX width={13} height={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-ink-700 px-5 py-3">
          <span className="text-xs text-ink-500">{mods.length} mod{mods.length === 1 ? '' : 's'} · {mods.filter((m) => m.partId).length} linked to catalogue</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={!canSave} className="btn-primary">Publish build</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
