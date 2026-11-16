import { useMemo, useState } from 'react';
import type { Build } from '@/types';
import { useAppStore } from '@/store/AppStore';
import { buildVehicle, buildValue, buildStats } from '@/services/builds';
import { vehicleById, vehicleLabel } from '@/data/vehicles';
import { BuildCard } from '@/components/community/BuildCard';
import { CreateBuildModal } from '@/components/community/CreateBuildModal';
import { SectionTitle, StatCard, EmptyState } from '@/components/ui';
import { IconUsers, IconPlus, IconWrench, IconCart, IconHeart } from '@/components/icons';

type Sort = 'popular' | 'newest' | 'value' | 'mods';

export function Community() {
  const { state } = useAppStore();
  const builds = state.builds;

  const [q, setQ] = useState('');
  const [vehicle, setVehicle] = useState('all');
  const [region, setRegion] = useState('all');
  const [sort, setSort] = useState<Sort>('popular');
  const [creating, setCreating] = useState(false);

  const vehicleOptions = useMemo(() => {
    const ids = Array.from(new Set(builds.map((b) => b.vehicleId)));
    return ids.map((id) => ({ id, label: vehicleById(id) ? vehicleLabel(vehicleById(id)!) : id }));
  }, [builds]);
  const regionOptions = useMemo(() => Array.from(new Set(builds.map((b) => b.region))).sort(), [builds]);

  const filtered = useMemo(() => {
    let list = builds.filter((b) => {
      if (vehicle !== 'all' && b.vehicleId !== vehicle) return false;
      if (region !== 'all' && b.region !== region) return false;
      if (q.trim()) {
        const hay = `${b.title} ${b.tagline} ${b.ownerHandle} ${buildVehicle(b) ? vehicleLabel(buildVehicle(b)!) : ''} ${b.mods.map((m) => m.title).join(' ')}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
    list = [...list];
    if (sort === 'popular') list.sort((a, b) => b.likes - a.likes);
    else if (sort === 'newest') list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === 'value') list.sort((a, b) => buildValue(b) - buildValue(a));
    else if (sort === 'mods') list.sort((a, b) => buildStats(b).mods - buildStats(a).mods);
    return list;
  }, [builds, q, vehicle, region, sort]);

  const totalMods = builds.reduce((n, b) => n + b.mods.length, 0);
  const totalShoppable = builds.reduce((n, b) => n + buildStats(b).linked, 0);
  const totalLikes = builds.reduce((n, b) => n + b.likes, 0);

  const select = 'rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100 outline-none focus:border-iq-500/70';

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="kicker">Community</div>
          <h1 className="font-display text-2xl font-extrabold text-ink-50">Rig Builds</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-400">
            Real 4WD builds from the community — every mod links to the catalogue, so a build is a
            shoppable spec sheet. Tap “Shop this build” to drop the parts straight into a quote.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <IconPlus width={16} height={16} /> Share your build
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Builds" value={builds.length} icon={<IconUsers width={18} height={18} />} accent />
        <StatCard label="Total mods" value={totalMods} icon={<IconWrench width={18} height={18} />} />
        <StatCard label="Shoppable parts" value={totalShoppable} icon={<IconCart width={18} height={18} />} />
        <StatCard label="Likes" value={totalLikes} icon={<IconHeart width={18} height={18} />} />
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search builds, rigs, mods…"
          className="input max-w-xs"
        />
        <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className={select}>
          <option value="all">All vehicles</option>
          {vehicleOptions.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className={select}>
          <option value="all">All regions</option>
          {regionOptions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={select}>
          <option value="popular">Most liked</option>
          <option value="newest">Newest</option>
          <option value="value">Build value</option>
          <option value="mods">Most mods</option>
        </select>
        <span className="ml-auto text-sm text-ink-400">{filtered.length} build{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="mt-4">
        <SectionTitle kicker={sort === 'popular' ? 'Trending' : 'Builds'}>
          {vehicle === 'all' ? 'All community builds' : vehicleOptions.find((v) => v.id === vehicle)?.label}
        </SectionTitle>
        {filtered.length === 0 ? (
          <EmptyState
            title="No builds match your filters"
            subtitle="Try clearing the search or filters, or share the first build for this setup."
            icon={<IconUsers width={32} height={32} />}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b: Build, i) => <BuildCard key={b.id} build={b} index={i} />)}
          </div>
        )}
      </div>

      {creating && <CreateBuildModal onClose={() => setCreating(false)} />}
    </div>
  );
}
