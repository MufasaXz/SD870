import { Link, Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { WaveBackground } from "@/components/WaveBackground";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="sd-wrap" style={{ paddingTop: 120, paddingBottom: 120, textAlign: "center" }}>
      <p className="sd-page-kicker">404</p>
      <h1 className="sd-page-title">Lost</h1>
      <p style={{ color: "var(--text-2)", marginBottom: 24 }}>This page doesn't exist.</p>
      <Link to="/" className="sd-nav-link accent">Go home</Link>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Custom ROM Hub · pipa & lemonade" },
      {
        name: "description",
        content:
          "Custom ROM firmware hub for Xiaomi Pad 6 and OnePlus 9R — ROMs, kernels, recoveries, and guides.",
      },
      { property: "og:title", content: "SD870 — Custom ROM Hub" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,800;1,700&family=Barlow:wght@400;500&family=Azeret+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <WaveBackground />
      <div className="sd-wrap">
        <Outlet />
      </div>
    </>
  );
}
