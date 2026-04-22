import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/links")({
  component: LinksPage,
});

interface SiteLink {
  id: string;
  key: string;
  label: string;
  url: string;
  category: string;
}

function LinksPage() {
  const [links, setLinks] = useState<SiteLink[]>([]);

  useEffect(() => {
    supabase
      .from("site_links")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setLinks((data ?? []) as SiteLink[]));
  }, []);

  const grouped = links.reduce<Record<string, SiteLink[]>>((acc, l) => {
    (acc[l.category] ||= []).push(l);
    return acc;
  }, {});

  return (
    <main className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-16">
      <h1 className="text-4xl font-bold">Links</h1>
      <p className="mt-2 text-muted-foreground">Channels, donations and socials.</p>

      <div className="mt-10 space-y-8">
        {Object.entries(grouped).map(([cat, items]) => (
          <section key={cat}>
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              // {cat}
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((l) => (
                <li key={l.id}>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group glass flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:border-accent/50"
                  >
                    <span>{l.label}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {links.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-muted-foreground">
            No links yet.
          </div>
        )}
      </div>
    </main>
  );
}
