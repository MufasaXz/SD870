import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import pipaImg from "@/assets/pipa.png";
import lemonadeImg from "@/assets/lemonade.png";

export const Route = createFileRoute("/")({
  component: Home,
});

interface Device {
  id: string;
  codename: string;
  display_name: string;
  status: string;
  image_url: string | null;
  description: string | null;
}
interface SiteLink {
  id: string;
  key: string;
  label: string;
  url: string;
  category: string;
  icon: string | null;
  owner: string | null;
}

const SPECS: Record<string, { chip: string; display: string; ram: string; battery: string }> = {
  pipa: { chip: "Snapdragon 870", display: '11" · 144 Hz', ram: "6–8 GB · 128–256", battery: "8840 mAh" },
  lemonade: { chip: "Snapdragon 870", display: '6.55" · 120 Hz', ram: "8–12 GB · 128–256", battery: "4500 mAh" },
};

const LOCAL_IMG: Record<string, string> = {
  pipa: pipaImg,
  lemonade: lemonadeImg,
};

function Home() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [links, setLinks] = useState<SiteLink[]>([]);
  const [donateOpen, setDonateOpen] = useState(false);
  const [tgOpen, setTgOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("devices")
      .select("id,codename,display_name,status,image_url,description")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setDevices((data ?? []) as Device[]));
    supabase
      .from("site_links")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setLinks((data ?? []) as SiteLink[]));
  }, []);

  const channelLinks = links.filter((l) => l.category === "channel" && l.owner !== "group");
  const groupLink = links.find((l) => l.category === "channel" && l.owner === "group");
  const nullPointerLinks = links.filter((l) => l.category === "payment" && l.owner === "nullpointer");
  const mufasaLinks = links.filter((l) => l.category === "payment" && l.owner === "mufasa");

  return (
    <>
      <header className="sd-header">
        <nav className="sd-nav">
          <Link to="/" className="sd-nav-logo">ROM_HUB /</Link>
          <div className="sd-nav-right">
            <Link to="/admin" className="sd-nav-link accent">Admin</Link>
          </div>
        </nav>
      </header>

      <section className="sd-hero">
        <p className="sd-hero-kicker">Custom Firmware Hub</p>
        <h1 className="sd-hero-title">SD<em>870</em></h1>
        <p className="sd-hero-sub">
          ROMs, kernels, recoveries and flashing guides for the two SD870 devices we maintain.
        </p>
      </section>

      <section className="sd-devices">
        <p className="sd-eyebrow sd-anim-1">// Supported Devices</p>
        <div className="sd-devices-grid">
          {devices.map((d, i) => {
            const spec = SPECS[d.codename] ?? { chip: "—", display: "—", ram: "—", battery: "—" };
            const isActive = d.status === "active";
            const animClass = i === 0 ? "sd-anim-2" : "sd-anim-3";
            const img = LOCAL_IMG[d.codename] ?? d.image_url ?? undefined;

            const inner = (
              <>
                <div className="sd-card-head">
                  <span className="sd-card-codename">{d.codename}</span>
                  <span className={`sd-card-status ${isActive ? "sd-s-active" : "sd-s-soon"}`}>
                    {isActive ? "● Active" : "◌ Coming Soon"}
                  </span>
                </div>
                <div className="sd-card-visual">
                  {img && <img src={img} alt={d.display_name} />}
                </div>
                <div className="sd-card-body">
                  <h2 className="sd-card-name">{d.display_name}</h2>
                  <div className="sd-card-specs">
                    <div className="sd-spec-item">
                      <span className="sd-spec-k">Chipset</span>
                      <span className="sd-spec-v">{spec.chip}</span>
                    </div>
                    <div className="sd-spec-item">
                      <span className="sd-spec-k">Display</span>
                      <span className="sd-spec-v">{spec.display}</span>
                    </div>
                    <div className="sd-spec-item">
                      <span className="sd-spec-k">RAM / Storage</span>
                      <span className="sd-spec-v">{spec.ram}</span>
                    </div>
                    <div className="sd-spec-item">
                      <span className="sd-spec-k">Battery</span>
                      <span className="sd-spec-v">{spec.battery}</span>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="sd-card-cta">
                      Explore Builds
                      <span className="sd-cta-circle">
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M1.5 5.5H9.5M9.5 5.5L6 2M9.5 5.5L6 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </span>
                  ) : (
                    <span className="sd-card-cta" style={{ color: "var(--text-3)" }}>Coming Soon</span>
                  )}
                </div>
              </>
            );

            if (isActive) {
              return (
                <Link
                  key={d.id}
                  to="/device/$codename"
                  params={{ codename: d.codename }}
                  className={`sd-device-card active ${animClass}`}
                >
                  {inner}
                </Link>
              );
            }
            return (
              <div key={d.id} className={`sd-device-card inactive ${animClass}`}>
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      <section className="sd-support" id="support">
        <p className="sd-eyebrow">// Support</p>
        <p className="sd-support-desc">
          This site took time to build and takes time to maintain. So sending moni wen?
        </p>
        <div className="sd-support-row">
          <button
            type="button"
            onClick={() => setDonateOpen(true)}
            className="sd-support-pill sd-support-pill-accent"
          >
            <span className="sd-pill-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </span>
            Donate
          </button>
          {channelLinks.length > 0 && (
            <button
              type="button"
              onClick={() => setTgOpen(true)}
              className="sd-support-pill"
            >
              <span className="sd-pill-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </span>
              Telegram Channels
            </button>
          )}
        </div>
      </section>

      <Footer />

      {donateOpen && (
        <DonateModal
          onClose={() => setDonateOpen(false)}
          nullPointerLinks={nullPointerLinks}
          mufasaLinks={mufasaLinks}
        />
      )}

      {tgOpen && (
        <TelegramModal
          onClose={() => setTgOpen(false)}
          channels={channelLinks}
          group={groupLink}
        />
      )}
    </>
  );
}

function DonateModal({
  onClose,
  nullPointerLinks,
  mufasaLinks,
}: {
  onClose: () => void;
  nullPointerLinks: SiteLink[];
  mufasaLinks: SiteLink[];
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="sd-modal-backdrop" onClick={onClose}>
      <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
        <button className="sd-modal-close" onClick={onClose} aria-label="Close">×</button>
        <p className="sd-eyebrow" style={{ marginBottom: 8 }}>// Donate</p>
        <h2 className="sd-modal-title">Support the maintainers</h2>
        <div className="sd-donate-cols">
          <DonateColumn name="Mufasa" links={mufasaLinks} />
          <div className="sd-donate-divider" aria-hidden />
          <DonateColumn name="Null Pointer" links={nullPointerLinks} />
        </div>
      </div>
    </div>
  );
}

function DonateColumn({ name, links }: { name: string; links: SiteLink[] }) {
  return (
    <div className="sd-donate-col">
      <h3 className="sd-donate-name">{name}</h3>
      <div className="sd-donate-list">
        {links.map((l) => (
          <SupportLink key={l.id} link={l} />
        ))}
        {links.length === 0 && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>No links yet.</p>
        )}
      </div>
    </div>
  );
}

function SupportLink({ link }: { link: SiteLink }) {
  const iconKey = (link.icon ?? link.key).toLowerCase();
  const iconClass =
    iconKey.includes("kofi") ? "sd-icon-kofi" :
    iconKey.includes("upi") ? "sd-icon-upi" :
    iconKey.includes("paypal") ? "sd-icon-paypal" :
    "sd-icon-other";

  function handleClick(e: React.MouseEvent) {
    if (link.url.startsWith("upi://")) {
      e.preventDefault();
      window.location.href = link.url;
    }
  }

  const typeLabel = link.url.includes("?pa=")
    ? link.url.split("?pa=")[1]?.split("&")[0] ?? ""
    : "";

  return (
    <a
      href={link.url}
      target={link.url.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      onClick={handleClick}
      className="sd-support-link"
    >
      <div className={`sd-support-icon ${iconClass}`}>
        <SupportIcon iconKey={iconKey} />
      </div>
      <div className="sd-support-info">
        <div className="sd-support-name">{link.label}</div>
        {typeLabel && <div className="sd-support-type">{typeLabel}</div>}
      </div>
      <span className="sd-support-arrow">→</span>
    </a>
  );
}

function SupportIcon({ iconKey }: { iconKey: string }) {
  if (iconKey.includes("kofi")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.67-2.059 3.015z" />
      </svg>
    );
  }
  if (iconKey.includes("paypal")) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.857-7.5 7.643z" />
    </svg>
  );
}

function TelegramModal({
  onClose,
  channels,
  group,
}: {
  onClose: () => void;
  channels: SiteLink[];
  group?: SiteLink;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const [c1, c2] = channels;

  return (
    <div className="sd-modal-backdrop" onClick={onClose}>
      <div className="sd-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <button className="sd-modal-close" onClick={onClose} aria-label="Close">×</button>
        <p className="sd-eyebrow" style={{ marginBottom: 8 }}>// Telegram</p>
        <h2 className="sd-modal-title">Join the channels</h2>

        <div className="sd-tg-cols">
          {c1 && <TelegramChannelCard link={c1} />}
          {c2 && <TelegramChannelCard link={c2} />}
        </div>

        {group && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <a
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sd-tg-group"
            >
              <span className="sd-tg-group-pfp">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </span>
              {group.label}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function TelegramChannelCard({ link }: { link: SiteLink }) {
  const handle = (() => {
    try {
      const u = new URL(link.url);
      const seg = u.pathname.replace(/^\//, "").split("/")[0];
      return seg ? `@${seg}` : link.label;
    } catch {
      return link.label;
    }
  })();

  const username = handle.replace(/^@/, "");
  // Telegram exposes a public preview avatar at this endpoint;
  // if it 404s the onError handler swaps in an initial.
  const pfpUrl = `https://t.me/i/userpic/320/${username}.jpg`;

  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className="sd-tg-card">
      <div className="sd-tg-pfp">
        <img
          src={pfpUrl}
          alt={handle}
          onError={(e) => {
            const img = e.currentTarget;
            const parent = img.parentElement;
            if (parent) {
              img.style.display = "none";
              parent.textContent = username.charAt(0).toUpperCase();
              parent.style.fontFamily = "var(--font-condensed)";
              parent.style.fontSize = "1.6rem";
              parent.style.fontWeight = "800";
            }
          }}
        />
      </div>
      <div className="sd-tg-handle">{handle}</div>
      <div className="sd-tg-sub">Channel</div>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="sd-footer">
      <span className="sd-foot-text">
        By <a href="https://mufasaxz.vercel.app" target="_blank" rel="noopener noreferrer">Mufasa</a>
        &nbsp;&amp;&nbsp;
        <a href="https://glitchwraith.vercel.app" target="_blank" rel="noopener noreferrer">Null Pointer</a>
        &nbsp;·&nbsp; © 2025–2026
      </span>
      <span className="sd-foot-disclaimer">
        Installing custom ROMs may void your warranty. Back up your data. You are responsible for your device.
      </span>
    </footer>
  );
}
