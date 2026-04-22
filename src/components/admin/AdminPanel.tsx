import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { LogOut, Plus, Trash2, Save, Pencil, Smartphone, Package, Cpu, ShieldCheck, Link as LinkIcon, KeyRound, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";

type Tab = "devices" | "roms" | "kernels" | "recoveries" | "links" | "password" | "audit";

interface Device {
  id: string; codename: string; display_name: string; status: string;
  image_url: string | null; description: string | null; sort_order: number; is_active: boolean;
}
interface Rom {
  id: string; device_id: string; name: string; version: string | null;
  android_version: string | null; maintainer: string | null;
  download_url: string; source_url: string | null; notes: string | null;
  build_flavor: string | null; official_status: string | null;
  flash_type: string | null; build_date: string | null;
  sort_order: number; is_active: boolean;
}
interface Kernel {
  id: string; device_id: string; name: string; kernel_type: string | null;
  maintainer: string | null; build_date: string | null;
  download_url: string; source_url: string | null; notes: string | null;
  sort_order: number; is_active: boolean;
}
interface Recovery {
  id: string; device_id: string; name: string;
  maintainer: string | null; build_date: string | null;
  download_url: string; source_url: string | null; notes: string | null;
  sort_order: number; is_active: boolean;
}
interface SiteLink {
  id: string; key: string; label: string; url: string; category: string;
  icon: string | null; sort_order: number; is_active: boolean; owner: string | null;
}
interface AuditEntry {
  id: string; actor_email: string | null; action: string; entity: string;
  entity_id: string | null; details: unknown; created_at: string;
}

export function AdminPanel({ session }: { session: Session }) {
  const [tab, setTab] = useState<Tab>("devices");

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "devices", label: "Devices", icon: Smartphone },
    { id: "roms", label: "ROMs", icon: Package },
    { id: "kernels", label: "Kernels", icon: Cpu },
    { id: "recoveries", label: "Recoveries", icon: ShieldCheck },
    { id: "links", label: "Links", icon: LinkIcon },
    { id: "password", label: "Password", icon: KeyRound },
    { id: "audit", label: "Activity", icon: Activity },
  ];

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-accent">// ADMIN PANEL</p>
          <h1 className="mt-1 text-3xl font-bold">Control center</h1>
          <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
        </div>
        <button
          onClick={() => supabase.auth.signOut()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                tab === t.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "devices" && <DevicesTab />}
      {tab === "roms" && <RomsTab />}
      {tab === "kernels" && <KernelsTab />}
      {tab === "recoveries" && <RecoveriesTab />}
      {tab === "links" && <LinksTab />}
      {tab === "password" && <PasswordTab />}
      {tab === "audit" && <AuditTab />}
    </main>
  );
}

/* ---------------- Devices ---------------- */
function DevicesTab() {
  const [items, setItems] = useState<Device[]>([]);
  const [editing, setEditing] = useState<Partial<Device> | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data } = await supabase.from("devices").select("*").order("sort_order");
    setItems((data ?? []) as Device[]);
  }
  useEffect(() => { void load(); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    const payload = {
      codename: editing.codename ?? "",
      display_name: editing.display_name ?? "",
      status: editing.status ?? "active",
      image_url: editing.image_url || null,
      description: editing.description || null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      await supabase.from("devices").update(payload).eq("id", editing.id);
      await logAudit("update", "device", editing.id, payload);
    } else {
      const { data } = await supabase.from("devices").insert(payload).select().single();
      await logAudit("create", "device", data?.id, payload);
    }
    setEditing(null);
    setBusy(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this device and all its ROMs/kernels/recoveries?")) return;
    await supabase.from("devices").delete().eq("id", id);
    await logAudit("delete", "device", id);
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="glass space-y-2 rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Devices</h2>
          <button
            onClick={() => setEditing({ codename: "", display_name: "", status: "active", sort_order: items.length })}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        </div>
        {items.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-black/30 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-xs text-accent">{d.codename}</p>
              <p className="truncate text-sm font-medium">{d.display_name}</p>
              <p className="text-xs text-muted-foreground">{d.status} · order {d.sort_order} · {d.is_active ? "active" : "hidden"}</p>
            </div>
            <button onClick={() => setEditing(d)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(d.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No devices yet.</p>}
      </div>

      {editing && (
        <form onSubmit={save} className="glass h-fit space-y-3 rounded-2xl p-5">
          <h3 className="text-sm font-semibold">{editing.id ? "Edit device" : "New device"}</h3>
          <Field label="Codename" value={editing.codename ?? ""} onChange={(v) => setEditing({ ...editing, codename: v })} />
          <Field label="Display name" value={editing.display_name ?? ""} onChange={(v) => setEditing({ ...editing, display_name: v })} />
          <SelectField
            label="Status"
            value={editing.status ?? "active"}
            onChange={(v) => setEditing({ ...editing, status: v })}
            options={[
              { value: "active", label: "Active" },
              { value: "soon", label: "Coming soon" },
            ]}
          />
          <Field label="Image URL" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} />
          <Field label="Description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} textarea />
          <Field label="Sort order" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
            Active (visible publicly)
          </label>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={busy} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60">
              <Save className="h-3.5 w-3.5" /> Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ---------------- ROMs ---------------- */
function RomsTab() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [items, setItems] = useState<Rom[]>([]);
  const [editing, setEditing] = useState<Partial<Rom> | null>(null);

  useEffect(() => {
    supabase.from("devices").select("*").order("sort_order").then(({ data }) => {
      const ds = (data ?? []) as Device[];
      setDevices(ds);
      if (ds.length && !deviceId) setDeviceId(ds[0].id);
    });
  }, []);

  async function loadRoms() {
    if (!deviceId) return;
    const { data } = await supabase.from("roms").select("*").eq("device_id", deviceId).order("sort_order");
    setItems((data ?? []) as Rom[]);
  }
  useEffect(() => { void loadRoms(); }, [deviceId]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      device_id: deviceId,
      name: editing.name ?? "",
      version: editing.version || null,
      android_version: editing.android_version || null,
      maintainer: editing.maintainer || null,
      download_url: editing.download_url ?? "",
      source_url: editing.source_url || null,
      notes: editing.notes || null,
      build_flavor: editing.build_flavor || null,
      official_status: editing.official_status || null,
      flash_type: editing.flash_type || null,
      build_date: editing.build_date || null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      await supabase.from("roms").update(payload).eq("id", editing.id);
      await logAudit("update", "rom", editing.id, payload);
    } else {
      const { data } = await supabase.from("roms").insert(payload).select().single();
      await logAudit("create", "rom", data?.id, payload);
    }
    setEditing(null);
    await loadRoms();
  }

  async function remove(id: string) {
    if (!confirm("Delete this ROM?")) return;
    await supabase.from("roms").delete().eq("id", id);
    await logAudit("delete", "rom", id);
    await loadRoms();
  }

  return (
    <div className="space-y-4">
      <DeviceSwitcher
        devices={devices}
        deviceId={deviceId}
        setDeviceId={setDeviceId}
        onAdd={() => setEditing({ name: "", download_url: "", sort_order: items.length, is_active: true, build_flavor: "vanilla", official_status: "official", flash_type: "clean" })}
        addLabel="Add ROM"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
        <div className="glass space-y-2 rounded-2xl p-4">
          {items.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-black/30 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[r.android_version && `A${r.android_version}`, r.official_status, r.build_flavor, r.flash_type, r.maintainer && `by ${r.maintainer}`].filter(Boolean).join(" · ")}
                </p>
              </div>
              <button onClick={() => setEditing(r)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(r.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No ROMs for this device yet.</p>}
        </div>

        {editing && (
          <form onSubmit={save} className="glass h-fit space-y-3 rounded-2xl p-5">
            <h3 className="text-sm font-semibold">{editing.id ? "Edit ROM" : "New ROM"}</h3>
            <Field label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Version" value={editing.version ?? ""} onChange={(v) => setEditing({ ...editing, version: v })} />
              <Field label="Android version" value={editing.android_version ?? ""} onChange={(v) => setEditing({ ...editing, android_version: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Build flavor"
                value={editing.build_flavor ?? ""}
                onChange={(v) => setEditing({ ...editing, build_flavor: v })}
                options={[
                  { value: "", label: "—" },
                  { value: "gapps", label: "GApps" },
                  { value: "vanilla", label: "Vanilla" },
                ]}
              />
              <SelectField
                label="Status"
                value={editing.official_status ?? ""}
                onChange={(v) => setEditing({ ...editing, official_status: v })}
                options={[
                  { value: "", label: "—" },
                  { value: "official", label: "Official" },
                  { value: "unofficial", label: "Unofficial" },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Flash type"
                value={editing.flash_type ?? ""}
                onChange={(v) => setEditing({ ...editing, flash_type: v })}
                options={[
                  { value: "", label: "—" },
                  { value: "dirty", label: "Dirty allowed" },
                  { value: "clean", label: "Clean only" },
                ]}
              />
              <Field label="Build date" type="date" value={editing.build_date ?? ""} onChange={(v) => setEditing({ ...editing, build_date: v })} />
            </div>
            <Field label="Maintainer" value={editing.maintainer ?? ""} onChange={(v) => setEditing({ ...editing, maintainer: v })} />
            <Field label="Download URL" value={editing.download_url ?? ""} onChange={(v) => setEditing({ ...editing, download_url: v })} />
            <Field label="Source URL" value={editing.source_url ?? ""} onChange={(v) => setEditing({ ...editing, source_url: v })} />
            <Field label="Notes" value={editing.notes ?? ""} onChange={(v) => setEditing({ ...editing, notes: v })} textarea />
            <Field label="Sort order" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active
            </label>
            <FormActions onCancel={() => setEditing(null)} />
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Kernels ---------------- */
function KernelsTab() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [items, setItems] = useState<Kernel[]>([]);
  const [editing, setEditing] = useState<Partial<Kernel> | null>(null);

  useEffect(() => {
    supabase.from("devices").select("*").order("sort_order").then(({ data }) => {
      const ds = (data ?? []) as Device[];
      setDevices(ds);
      if (ds.length && !deviceId) setDeviceId(ds[0].id);
    });
  }, []);

  async function load() {
    if (!deviceId) return;
    const { data } = await supabase.from("kernels").select("*").eq("device_id", deviceId).order("sort_order");
    setItems((data ?? []) as Kernel[]);
  }
  useEffect(() => { void load(); }, [deviceId]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      device_id: deviceId,
      name: editing.name ?? "",
      kernel_type: editing.kernel_type || null,
      maintainer: editing.maintainer || null,
      build_date: editing.build_date || null,
      download_url: editing.download_url ?? "",
      source_url: editing.source_url || null,
      notes: editing.notes || null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      await supabase.from("kernels").update(payload).eq("id", editing.id);
      await logAudit("update", "kernel", editing.id, payload);
    } else {
      const { data } = await supabase.from("kernels").insert(payload).select().single();
      await logAudit("create", "kernel", data?.id, payload);
    }
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this kernel?")) return;
    await supabase.from("kernels").delete().eq("id", id);
    await logAudit("delete", "kernel", id);
    await load();
  }

  return (
    <div className="space-y-4">
      <DeviceSwitcher
        devices={devices}
        deviceId={deviceId}
        setDeviceId={setDeviceId}
        onAdd={() => setEditing({ name: "", download_url: "", sort_order: items.length, is_active: true, kernel_type: "A16" })}
        addLabel="Add Kernel"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
        <div className="glass space-y-2 rounded-2xl p-4">
          {items.map((k) => (
            <div key={k.id} className="flex items-center gap-3 rounded-lg border border-border bg-black/30 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{k.name} {k.kernel_type && <span className="font-mono text-xs text-accent">[{k.kernel_type}]</span>}</p>
                <p className="truncate text-xs text-muted-foreground">{[k.maintainer && `by ${k.maintainer}`, k.build_date].filter(Boolean).join(" · ")}</p>
              </div>
              <button onClick={() => setEditing(k)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(k.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No kernels for this device yet.</p>}
        </div>

        {editing && (
          <form onSubmit={save} className="glass h-fit space-y-3 rounded-2xl p-5">
            <h3 className="text-sm font-semibold">{editing.id ? "Edit kernel" : "New kernel"}</h3>
            <Field label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Type"
                value={editing.kernel_type ?? ""}
                onChange={(v) => setEditing({ ...editing, kernel_type: v })}
                options={[
                  { value: "", label: "—" },
                  { value: "A16", label: "A16" },
                  { value: "MIUI", label: "MIUI" },
                  { value: "HOS", label: "HOS" },
                  { value: "Other", label: "Other" },
                ]}
              />
              <Field label="Build date" type="date" value={editing.build_date ?? ""} onChange={(v) => setEditing({ ...editing, build_date: v })} />
            </div>
            <Field label="Maintainer" value={editing.maintainer ?? ""} onChange={(v) => setEditing({ ...editing, maintainer: v })} />
            <Field label="Download URL" value={editing.download_url ?? ""} onChange={(v) => setEditing({ ...editing, download_url: v })} />
            <Field label="Source URL" value={editing.source_url ?? ""} onChange={(v) => setEditing({ ...editing, source_url: v })} />
            <Field label="Notes" value={editing.notes ?? ""} onChange={(v) => setEditing({ ...editing, notes: v })} textarea />
            <Field label="Sort order" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active
            </label>
            <FormActions onCancel={() => setEditing(null)} />
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Recoveries ---------------- */
function RecoveriesTab() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [items, setItems] = useState<Recovery[]>([]);
  const [editing, setEditing] = useState<Partial<Recovery> | null>(null);

  useEffect(() => {
    supabase.from("devices").select("*").order("sort_order").then(({ data }) => {
      const ds = (data ?? []) as Device[];
      setDevices(ds);
      if (ds.length && !deviceId) setDeviceId(ds[0].id);
    });
  }, []);

  async function load() {
    if (!deviceId) return;
    const { data } = await supabase.from("recoveries").select("*").eq("device_id", deviceId).order("sort_order");
    setItems((data ?? []) as Recovery[]);
  }
  useEffect(() => { void load(); }, [deviceId]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      device_id: deviceId,
      name: editing.name ?? "",
      maintainer: editing.maintainer || null,
      build_date: editing.build_date || null,
      download_url: editing.download_url ?? "",
      source_url: editing.source_url || null,
      notes: editing.notes || null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      await supabase.from("recoveries").update(payload).eq("id", editing.id);
      await logAudit("update", "recovery", editing.id, payload);
    } else {
      const { data } = await supabase.from("recoveries").insert(payload).select().single();
      await logAudit("create", "recovery", data?.id, payload);
    }
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this recovery?")) return;
    await supabase.from("recoveries").delete().eq("id", id);
    await logAudit("delete", "recovery", id);
    await load();
  }

  return (
    <div className="space-y-4">
      <DeviceSwitcher
        devices={devices}
        deviceId={deviceId}
        setDeviceId={setDeviceId}
        onAdd={() => setEditing({ name: "", download_url: "", sort_order: items.length, is_active: true })}
        addLabel="Add Recovery"
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
        <div className="glass space-y-2 rounded-2xl p-4">
          {items.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border bg-black/30 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[r.maintainer && `by ${r.maintainer}`, r.build_date].filter(Boolean).join(" · ")}</p>
              </div>
              <button onClick={() => setEditing(r)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => remove(r.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No recoveries for this device yet.</p>}
        </div>

        {editing && (
          <form onSubmit={save} className="glass h-fit space-y-3 rounded-2xl p-5">
            <h3 className="text-sm font-semibold">{editing.id ? "Edit recovery" : "New recovery"}</h3>
            <Field label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Maintainer" value={editing.maintainer ?? ""} onChange={(v) => setEditing({ ...editing, maintainer: v })} />
              <Field label="Build date" type="date" value={editing.build_date ?? ""} onChange={(v) => setEditing({ ...editing, build_date: v })} />
            </div>
            <Field label="Download URL" value={editing.download_url ?? ""} onChange={(v) => setEditing({ ...editing, download_url: v })} />
            <Field label="Source URL" value={editing.source_url ?? ""} onChange={(v) => setEditing({ ...editing, source_url: v })} />
            <Field label="Notes" value={editing.notes ?? ""} onChange={(v) => setEditing({ ...editing, notes: v })} textarea />
            <Field label="Sort order" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active
            </label>
            <FormActions onCancel={() => setEditing(null)} />
          </form>
        )}
      </div>
    </div>
  );
}

/* ---------------- Links ---------------- */
function LinksTab() {
  const [items, setItems] = useState<SiteLink[]>([]);
  const [editing, setEditing] = useState<Partial<SiteLink> | null>(null);

  async function load() {
    const { data } = await supabase.from("site_links").select("*").order("sort_order");
    setItems((data ?? []) as SiteLink[]);
  }
  useEffect(() => { void load(); }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const payload = {
      key: editing.key ?? "",
      label: editing.label ?? "",
      url: editing.url ?? "",
      category: editing.category ?? "social",
      icon: editing.icon || null,
      owner: editing.owner || null,
      sort_order: editing.sort_order ?? 0,
      is_active: editing.is_active ?? true,
    };
    if (editing.id) {
      await supabase.from("site_links").update(payload).eq("id", editing.id);
      await logAudit("update", "link", editing.id, payload);
    } else {
      const { data } = await supabase.from("site_links").insert(payload).select().single();
      await logAudit("create", "link", data?.id, payload);
    }
    setEditing(null);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this link?")) return;
    await supabase.from("site_links").delete().eq("id", id);
    await logAudit("delete", "link", id);
    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="glass space-y-2 rounded-2xl p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Payment / channel / social links</h2>
          <button
            onClick={() => setEditing({ key: "", label: "", url: "", category: "payment", owner: "nullpointer", sort_order: items.length, is_active: true })}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
          >
            <Plus className="h-3 w-3" /> New
          </button>
        </div>
        {items.map((l) => (
          <div key={l.id} className="flex items-center gap-3 rounded-lg border border-border bg-black/30 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {l.label}{" "}
                <span className="font-mono text-xs text-muted-foreground">[{l.category}{l.owner ? ` · ${l.owner}` : ""}]</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">{l.url}</p>
            </div>
            <button onClick={() => setEditing(l)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => remove(l.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>

      {editing && (
        <form onSubmit={save} className="glass h-fit space-y-3 rounded-2xl p-5">
          <h3 className="text-sm font-semibold">{editing.id ? "Edit link" : "New link"}</h3>
          <Field label="Key (unique id)" value={editing.key ?? ""} onChange={(v) => setEditing({ ...editing, key: v })} />
          <Field label="Label" value={editing.label ?? ""} onChange={(v) => setEditing({ ...editing, label: v })} />
          <Field label="URL" value={editing.url ?? ""} onChange={(v) => setEditing({ ...editing, url: v })} />
          <SelectField
            label="Category"
            value={editing.category ?? "payment"}
            onChange={(v) => setEditing({ ...editing, category: v })}
            options={[
              { value: "payment", label: "payment" },
              { value: "channel", label: "channel (Telegram etc)" },
              { value: "social", label: "social" },
              { value: "other", label: "other" },
            ]}
          />
          <SelectField
            label="Owner (for payment links)"
            value={editing.owner ?? ""}
            onChange={(v) => setEditing({ ...editing, owner: v })}
            options={[
              { value: "", label: "— (not a personal donation)" },
              { value: "nullpointer", label: "Null Pointer" },
              { value: "mufasa", label: "Mufasa" },
            ]}
          />
          <Field label="Icon hint (kofi/upi/paypal/telegram)" value={editing.icon ?? ""} onChange={(v) => setEditing({ ...editing, icon: v })} />
          <Field label="Sort order" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
            Active
          </label>
          <FormActions onCancel={() => setEditing(null)} />
        </form>
      )}
    </div>
  );
}

/* ---------------- Password ---------------- */
function PasswordTab() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 8) return setMsg({ type: "err", text: "Min 8 characters." });
    if (pw !== pw2) return setMsg({ type: "err", text: "Passwords don't match." });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ type: "err", text: error.message });
    setMsg({ type: "ok", text: "Password updated." });
    setPw(""); setPw2("");
    await logAudit("password_change", "auth");
  }

  return (
    <form onSubmit={submit} className="glass max-w-md space-y-3 rounded-2xl p-6">
      <h2 className="text-lg font-semibold">Change admin password</h2>
      <input type="password" placeholder="new password" value={pw} onChange={(e) => setPw(e.target.value)}
        className="w-full rounded-md border border-border bg-input/50 px-3 py-2 text-sm" />
      <input type="password" placeholder="confirm" value={pw2} onChange={(e) => setPw2(e.target.value)}
        className="w-full rounded-md border border-border bg-input/50 px-3 py-2 text-sm" />
      {msg && <p className={`text-sm ${msg.type === "ok" ? "text-accent" : "text-destructive"}`}>{msg.text}</p>}
      <button disabled={busy} className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60">
        <Save className="h-3.5 w-3.5" /> Update password
      </button>
    </form>
  );
}

/* ---------------- Audit ---------------- */
function AuditTab() {
  const [items, setItems] = useState<AuditEntry[]>([]);

  useEffect(() => {
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setItems((data ?? []) as AuditEntry[]));
  }, []);

  return (
    <div className="glass rounded-2xl p-4">
      <h2 className="mb-4 text-lg font-semibold">Recent activity</h2>
      <ul className="space-y-2 font-mono text-xs">
        {items.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-2 border-b border-border/40 py-2">
            <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
            <span className="text-accent">{a.action}</span>
            <span>{a.entity}</span>
            {a.entity_id && <span className="text-muted-foreground">#{a.entity_id.slice(0, 8)}</span>}
            <span className="ml-auto text-muted-foreground">{a.actor_email}</span>
          </li>
        ))}
        {items.length === 0 && <li className="py-6 text-center text-muted-foreground">No activity yet.</li>}
      </ul>
    </div>
  );
}

/* ---------------- Helpers ---------------- */
function DeviceSwitcher({ devices, deviceId, setDeviceId, onAdd, addLabel }: {
  devices: Device[]; deviceId: string; setDeviceId: (id: string) => void; onAdd: () => void; addLabel: string;
}) {
  return (
    <div className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
      <label className="text-sm font-medium">Device:</label>
      <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
        className="rounded-md border border-border bg-input/50 px-3 py-1.5 text-sm">
        {devices.map((d) => (<option key={d.id} value={d.id}>{d.display_name} ({d.codename})</option>))}
      </select>
      <button
        onClick={onAdd}
        className="ml-auto inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
      >
        <Plus className="h-3 w-3" /> {addLabel}
      </button>
    </div>
  );
}

function FormActions({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex gap-2 pt-2">
      <button type="submit" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
        <Save className="h-3.5 w-3.5" /> Save
      </button>
      <button type="button" onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">Cancel</button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className="w-full rounded-md border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-accent" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-accent" />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-input/50 px-3 py-2 text-sm outline-none focus:border-accent">
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}
