import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "./index";

export const Route = createFileRoute("/device/$codename")({
  component: DevicePage,
});

interface Device {
  id: string; codename: string; display_name: string;
  status: string; image_url: string | null; description: string | null;
}
interface Rom {
  id: string; name: string; version: string | null;
  android_version: string | null; maintainer: string | null;
  download_url: string; source_url: string | null; notes: string | null;
  build_flavor: string | null; official_status: string | null;
  flash_type: string | null; build_date: string | null;
}
interface Kernel {
  id: string; name: string; kernel_type: string | null;
  maintainer: string | null; build_date: string | null;
  download_url: string; source_url: string | null; notes: string | null;
}
interface Recovery {
  id: string; name: string; maintainer: string | null;
  build_date: string | null; download_url: string;
  source_url: string | null; notes: string | null;
}

const SPECS: Record<string, string[]> = {
  pipa: ["Snapdragon 870", '11" · 144 Hz', "8840 mAh"],
  lemonade: ["Snapdragon 870", '6.55" · 120 Hz', "4500 mAh"],
};

type Tab = "roms" | "kernels" | "recoveries";

function DevicePage() {
  const { codename } = Route.useParams();
  const [device, setDevice] = useState<Device | null>(null);
  const [roms, setRoms] = useState<Rom[]>([]);
  const [kernels, setKernels] = useState<Kernel[]>([]);
  const [recoveries, setRecoveries] = useState<Recovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("roms");

  useEffect(() => {
    (async () => {
      const { data: dev } = await supabase
        .from("devices")
        .select("*")
        .eq("codename", codename)
        .eq("is_active", true)
        .maybeSingle();
      if (!dev) { setLoading(false); return; }
      setDevice(dev as Device);
      const id = (dev as Device).id;
      const [r, k, rc] = await Promise.all([
        supabase.from("roms").select("*").eq("device_id", id).eq("is_active", true).order("sort_order"),
        supabase.from("kernels").select("*").eq("device_id", id).eq("is_active", true).order("sort_order"),
        supabase.from("recoveries").select("*").eq("device_id", id).eq("is_active", true).order("sort_order"),
      ]);
      setRoms((r.data ?? []) as Rom[]);
      setKernels((k.data ?? []) as Kernel[]);
      setRecoveries((rc.data ?? []) as Recovery[]);
      setLoading(false);
    })();
  }, [codename]);

  if (loading) {
    return (
      <div style={{ padding: "120px 0", textAlign: "center", color: "var(--text-2)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
        Loading...
      </div>
    );
  }

  if (!device) {
    return (
      <div style={{ padding: "120px 0", textAlign: "center" }}>
        <p className="sd-page-kicker">404</p>
        <h1 className="sd-page-title">Device not found</h1>
        <Link to="/" className="sd-nav-link accent">Go home</Link>
      </div>
    );
  }

  const specs = SPECS[device.codename] ?? [];

  return (
    <>
      <header className="sd-header">
        <nav className="sd-nav">
          <div className="sd-nav-left">
            <Link to="/" className="sd-nav-back">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M6.5 1.5L3 5l3.5 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Home
            </Link>
            <span className="sd-nav-sep">/</span>
            <span className="sd-nav-current">{device.codename}</span>
          </div>
          <div className="sd-nav-right">
            <Link to="/admin" className="sd-nav-link">Admin</Link>
          </div>
        </nav>
      </header>

      <section className="sd-page-header">
        <p className="sd-page-kicker">{device.codename}</p>
        <h1 className="sd-page-title">{device.display_name}</h1>
        <div className="sd-page-meta">
          {specs.map((s) => (
            <span key={s} className="sd-meta-tag">{s}</span>
          ))}
        </div>
      </section>

      <section className="sd-releases">
        <p className="sd-eyebrow">// Releases</p>
        <div className="sd-tabs">
          <button onClick={() => setTab("roms")} className={`sd-tab-btn ${tab === "roms" ? "active" : ""}`}>ROMs</button>
          <button onClick={() => setTab("kernels")} className={`sd-tab-btn ${tab === "kernels" ? "active" : ""}`}>Kernels</button>
          <button onClick={() => setTab("recoveries")} className={`sd-tab-btn ${tab === "recoveries" ? "active" : ""}`}>Recoveries</button>
        </div>

        {tab === "roms" && <RomList roms={roms} />}
        {tab === "kernels" && <KernelList kernels={kernels} />}
        {tab === "recoveries" && <RecoveryList recoveries={recoveries} />}
      </section>

      <Footer />
    </>
  );
}

function fmtDate(d: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function EmptyBlock({ label }: { label: string }) {
  return (
    <div className="sd-rel-empty">
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
        // No {label} yet
      </p>
      <p style={{ fontSize: "0.85rem" }}>Check back soon — builds will be published here.</p>
    </div>
  );
}

function RomList({ roms }: { roms: Rom[] }) {
  if (roms.length === 0) return <EmptyBlock label="ROMs" />;
  return (
    <div className="sd-rel-list">
      {roms.map((r) => {
        const isOfficial = (r.official_status ?? "").toLowerCase() === "official";
        const isClean = (r.flash_type ?? "").toLowerCase() === "clean";
        return (
          <div key={r.id} className="sd-rel-card">
            <div className="sd-rel-card-head">
              <h3 className="sd-rel-name">{r.name}</h3>
              {r.notes && <p className="sd-rel-notes">{r.notes}</p>}
            </div>
            <div className="sd-rel-tags">
              {r.android_version && <span className="sd-tag sd-tag-android">A{r.android_version}</span>}
              {r.official_status && (
                <span className={`sd-tag ${isOfficial ? "sd-tag-official" : "sd-tag-unofficial"}`}>
                  {r.official_status.toUpperCase()}
                </span>
              )}
              {r.build_flavor && (
                <span className={`sd-tag ${r.build_flavor.toLowerCase() === "gapps" ? "sd-tag-gapps" : "sd-tag-vanilla"}`}>
                  {r.build_flavor.toUpperCase()}
                </span>
              )}
              {r.flash_type && (
                <span className={`sd-tag ${isClean ? "sd-tag-clean" : "sd-tag-dirty"}`}>
                  {r.flash_type.toUpperCase()} {!isClean && "✓"}
                </span>
              )}
            </div>
            <div className="sd-rel-meta">
              {r.build_date && <span className="sd-rel-date">{fmtDate(r.build_date)}</span>}
              {r.maintainer && <span className="sd-rel-maintainer">by {r.maintainer}</span>}
            </div>
            <div className="sd-rel-actions">
              {r.source_url && (
                <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="sd-rel-btn">Source</a>
              )}
              {r.download_url ? (
                <a href={r.download_url} target="_blank" rel="noopener noreferrer" className="sd-rel-btn sd-rel-btn-primary">
                  ⬇ Download
                </a>
              ) : (
                <span className="sd-rel-btn sd-rel-btn-disabled">No link yet</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KernelList({ kernels }: { kernels: Kernel[] }) {
  if (kernels.length === 0) return <EmptyBlock label="kernels" />;
  return (
    <div className="sd-rel-list">
      {kernels.map((k) => (
        <div key={k.id} className="sd-rel-card">
          <div className="sd-rel-card-head">
            <h3 className="sd-rel-name">{k.name}</h3>
            {k.notes && <p className="sd-rel-notes">{k.notes}</p>}
          </div>
          <div className="sd-rel-tags">
            {k.kernel_type && (
              <span className="sd-tag sd-tag-kernel">{k.kernel_type.toUpperCase()}</span>
            )}
          </div>
          <div className="sd-rel-meta">
            {k.build_date && <span className="sd-rel-date">{fmtDate(k.build_date)}</span>}
            {k.maintainer && <span className="sd-rel-maintainer">by {k.maintainer}</span>}
          </div>
          <div className="sd-rel-actions">
            {k.source_url && (
              <a href={k.source_url} target="_blank" rel="noopener noreferrer" className="sd-rel-btn">Source</a>
            )}
            {k.download_url ? (
              <a href={k.download_url} target="_blank" rel="noopener noreferrer" className="sd-rel-btn sd-rel-btn-primary">
                ⬇ Download
              </a>
            ) : (
              <span className="sd-rel-btn sd-rel-btn-disabled">No link yet</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecoveryList({ recoveries }: { recoveries: Recovery[] }) {
  if (recoveries.length === 0) return <EmptyBlock label="recoveries" />;
  return (
    <div className="sd-rel-list">
      {recoveries.map((rc) => (
        <div key={rc.id} className="sd-rel-card">
          <div className="sd-rel-card-head">
            <h3 className="sd-rel-name">{rc.name}</h3>
            {rc.notes && <p className="sd-rel-notes">{rc.notes}</p>}
          </div>
          <div className="sd-rel-meta">
            {rc.build_date && <span className="sd-rel-date">{fmtDate(rc.build_date)}</span>}
            {rc.maintainer && <span className="sd-rel-maintainer">by {rc.maintainer}</span>}
          </div>
          <div className="sd-rel-actions">
            {rc.source_url && (
              <a href={rc.source_url} target="_blank" rel="noopener noreferrer" className="sd-rel-btn">Source</a>
            )}
            {rc.download_url ? (
              <a href={rc.download_url} target="_blank" rel="noopener noreferrer" className="sd-rel-btn sd-rel-btn-primary">
                ⬇ Download
              </a>
            ) : (
              <span className="sd-rel-btn sd-rel-btn-disabled">No link yet</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
