import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

// The Bhosdu admin login is mapped server-side to this internal email.
// (Supabase auth requires an email; we hide that behind a username field.)
const USERNAME_TO_EMAIL: Record<string, string> = {
  bhosdu: "bhosdu@sd870.local",
};

function AdminRoute() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void checkAdmin(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void checkAdmin(data.session);
    });
    return () => sub.subscription.unsubscribe();

    async function checkAdmin(s: Session | null) {
      if (!s?.user) { setIsAdmin(false); setLoading(false); return; }
      const { data } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", s.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data); setLoading(false);
    }
  }, []);

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
            <span className="sd-nav-current">admin</span>
          </div>
        </nav>
      </header>

      {loading ? (
        <div style={{ padding: "120px 0", textAlign: "center", fontFamily: "var(--font-mono)", color: "var(--text-2)" }}>
          Loading...
        </div>
      ) : !session ? (
        <AuthForm />
      ) : !isAdmin ? (
        <NotAuthorized email={session.user.email ?? ""} />
      ) : (
        <AdminPanel session={session} />
      )}
    </>
  );
}

function AuthForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const key = username.trim().toLowerCase();
      const email = USERNAME_TO_EMAIL[key] ?? (username.includes("@") ? username : null);
      if (!email) throw new Error("Invalid username or password");
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Invalid username or password");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ padding: "80px 0 120px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <p className="sd-page-kicker">// admin</p>
        <h1 className="sd-page-title" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>Sign in</h1>
        <p style={{ color: "var(--text-2)", marginTop: 8, marginBottom: 32, fontSize: "0.92rem" }}>
          Restricted area. Only the maintainer can sign in.
        </p>

        <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
          <Field
            label="Username"
            value={username}
            onChange={setUsername}
            placeholder="username"
            autoComplete="username"
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="password"
            autoComplete="current-password"
          />
          {err && (
            <p style={{ color: "var(--danger)", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
              {err}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="sd-nav-link accent"
            style={{ marginTop: 8, padding: "12px 18px", fontSize: "0.78rem", textAlign: "center", border: "none", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-2)" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-c)",
          borderRadius: 8,
          padding: "12px 14px",
          color: "var(--text-c)",
          fontFamily: "var(--font-display)",
          fontSize: "0.95rem",
          outline: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-c)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-c)")}
      />
    </label>
  );
}

function NotAuthorized({ email }: { email: string }) {
  return (
    <main style={{ padding: "80px 0 120px", textAlign: "center" }}>
      <p className="sd-page-kicker">403</p>
      <h1 className="sd-page-title" style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)" }}>Not an admin</h1>
      <p style={{ color: "var(--text-2)", marginBottom: 24 }}>
        {email} is signed in but not an admin.
      </p>
      <button onClick={() => supabase.auth.signOut()} className="sd-nav-link" style={{ display: "inline-block", border: "1px solid var(--border-c)", cursor: "pointer" }}>
        Sign out
      </button>
    </main>
  );
}
