// App.jsx — sign in, list your games, create games, play.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import Table from "./Table.jsx";
import { S, fontCss } from "./gameMeta.js";

function Frame({ children }) {
  return (
    <div className="md-body" style={{ minHeight: "100vh", background: S.table, display: "flex", flexDirection: "column", alignItems: "center", padding: 20 }}>
      <style>{fontCss}</style>
      <div style={{ width: "100%", maxWidth: 420 }}>{children}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "13px 14px", marginBottom: 10,
  borderRadius: 10, border: `1px solid ${S.line}`, background: S.panel, color: S.stock, fontSize: 15,
};
const bigBtn = (enabled) => ({
  width: "100%", padding: "15px 0", borderRadius: 12, border: "none", fontSize: 17, letterSpacing: 1,
  background: enabled ? S.red : S.panelLite, color: enabled ? "#fff" : S.dim,
  cursor: enabled ? "pointer" : "default", boxShadow: enabled ? "0 4px 0 #9C2E20" : "none",
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    setBusy(false);
  };
  return (
    <Frame>
      <div style={{ textAlign: "center", marginTop: "18vh" }}>
        <h1 className="md-display" style={{ color: S.stock, fontSize: 34, margin: "0 0 4px" }}>DEAL TABLE</h1>
        <p style={{ color: S.dim, fontSize: 14, margin: "0 0 24px" }}>Sign in to join the table.</p>
      </div>
      <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="md-body" />
      <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="md-body"
        onKeyDown={(e) => e.key === "Enter" && go()} />
      {err && <p style={{ color: S.red, fontSize: 13 }}>{err}</p>}
      <button className="md-display" disabled={busy || !email || !password} style={bigBtn(!!email && !!password && !busy)} onClick={go}>SIGN IN</button>
      <p style={{ color: S.dim, fontSize: 12.5, marginTop: 14, textAlign: "center" }}>No account? Ask the game host to make you one.</p>
    </Frame>
  );
}

function GameList({ session, onOpen }) {
  const [rows, setRows] = useState(null);
  const [emails, setEmails] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_views")
      .select("game_id, player_name, view, updated_at")
      .order("updated_at", { ascending: false });
    if (error) setErr(error.message);
    else setRows(data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const createGame = async () => {
    setBusy(true); setErr(null);
    const list = emails.split(",").map((e) => e.trim()).filter(Boolean);
    const { data, error } = await supabase.functions.invoke("create-game", { body: { emails: list } });
    setBusy(false);
    if (error) {
      // surface the function's error body if present
      let msg = error.message;
      try { const body = await error.context?.json(); if (body?.error) msg = body.error; } catch {}
      setErr(msg);
      return;
    }
    if (data?.error) { setErr(data.error); return; }
    onOpen(data.gameId);
  };

  return (
    <Frame>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 18px" }}>
        <h1 className="md-display" style={{ color: S.stock, fontSize: 22, margin: 0 }}>DEAL TABLE</h1>
        <button onClick={() => supabase.auth.signOut()} className="md-body" style={{ background: "none", border: `1px solid ${S.line}`, color: S.dim, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
          Sign out
        </button>
      </div>

      <div style={{ background: S.panel, borderRadius: 12, padding: 14, marginBottom: 18 }}>
        <div className="md-body" style={{ color: S.stock, fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Start a game</div>
        <input style={inputStyle} placeholder="Friends' emails, comma-separated" value={emails} onChange={(e) => setEmails(e.target.value)} className="md-body" />
        <button className="md-display" disabled={busy} style={{ ...bigBtn(!busy), fontSize: 15, padding: "12px 0" }} onClick={createGame}>
          {busy ? "DEALING…" : "DEAL ME IN"}
        </button>
        {err && <p style={{ color: S.red, fontSize: 13, marginBottom: 0 }}>{err}</p>}
      </div>

      <div className="md-body" style={{ color: S.dim, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>YOUR GAMES</div>
      {rows === null && <p style={{ color: S.dim, fontSize: 14 }}>Loading…</p>}
      {rows?.length === 0 && <p style={{ color: S.dim, fontSize: 14 }}>No games yet. Start one above.</p>}
      {rows?.map((r) => {
        const v = r.view;
        const yourMove = !v.winner && (v.waitingOn?.includes(r.player_name) || (v.pendingCount === 0 && v.turn.playerId === r.player_name));
        return (
          <button key={r.game_id} onClick={() => onOpen(r.game_id)} className="md-body" style={{
            display: "block", width: "100%", textAlign: "left", background: S.panel, borderRadius: 12,
            padding: "12px 14px", marginBottom: 10, cursor: "pointer",
            border: yourMove ? `2px solid ${S.red}` : `1px solid ${S.line}`,
          }}>
            <div style={{ color: S.stock, fontWeight: 700, fontSize: 14 }}>
              {v.playerOrder.join(" · ")}
            </div>
            <div style={{ color: v.winner ? S.gold : yourMove ? S.red : S.dim, fontSize: 12.5, marginTop: 3 }}>
              {v.winner ? `🏆 ${v.winner} won` : yourMove ? "● Your move" : `Waiting on ${v.waitingOn?.length ? v.waitingOn.join(", ") : v.turn.playerId}`}
            </div>
          </button>
        );
      })}
    </Frame>
  );
}

function GameScreen({ session, gameId, onBack }) {
  const [view, setView] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("game_views").select("view")
      .eq("game_id", gameId).eq("user_id", session.user.id).single();
    if (error) setErr(error.message);
    else setView(data.view);
  }, [gameId, session.user.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime: refresh when my view row changes (i.e., anyone moved)
  useEffect(() => {
    const ch = supabase
      .channel(`game-${gameId}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_views", filter: `game_id=eq.${gameId}` },
        () => load())
      .subscribe();
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => { supabase.removeChannel(ch); document.removeEventListener("visibilitychange", onVisible); };
  }, [gameId, load]);

  const onSubmit = async (action) => {
    const { data, error } = await supabase.functions.invoke("move", { body: { gameId, action } });
    if (error) {
      try { const body = await error.context?.json(); if (body?.error) return body.error; } catch {}
      return error.message;
    }
    if (data?.error) return data.error;
    setView(data.view);
    return null;
  };

  if (err) return <Frame><p style={{ color: S.red }}>{err}</p><button onClick={onBack} className="md-body" style={{ ...bigBtn(true), background: S.panel, boxShadow: "none" }}>Back</button></Frame>;
  if (!view) return <Frame><p style={{ color: S.dim, marginTop: "30vh", textAlign: "center" }}>Shuffling…</p></Frame>;

  return (
    <div>
      <button onClick={onBack} className="md-body" style={{ position: "fixed", top: 11, right: 70, zIndex: 40, background: S.panel, color: S.dim, border: `1px solid ${S.line}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>
        Games
      </button>
      <NotifySetup topic={view.ntfyTopic} />
      <Table view={view} onSubmit={onSubmit} />
    </div>
  );
}

// Shows once per game per device: how to subscribe to turn alerts.
// Remembers dismissal in localStorage so it doesn't nag.
function NotifySetup({ topic }) {
  const key = topic ? `notify-dismissed-${topic}` : null;
  const [open, setOpen] = useState(() => {
    if (!topic) return false;
    try { return localStorage.getItem(key) !== "1"; } catch { return true; }
  });
  if (!open || !topic) return null;
  const base = "https://ntfy.sh";
  const dismiss = () => { try { localStorage.setItem(key, "1"); } catch {} setOpen(false); };
  return (
    <div className="md-body" style={{ background: S.panelLite, borderBottom: `1px solid ${S.line}`, padding: "12px 14px 14px" }}>
      <style>{fontCss}</style>
      <div style={{ color: S.stock, fontWeight: 700, fontSize: 13.5, marginBottom: 4 }}>Get a ping when it's your turn</div>
      <div style={{ color: S.dim, fontSize: 12.5, lineHeight: 1.45, marginBottom: 10 }}>
        Install the free <b style={{ color: S.stock }}>ntfy</b> app (App Store / Google Play), then subscribe to your private topic below. Subscribe just once — it's yours for every game. Keep it to yourself.
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <code className="md-mono" style={{ background: S.table, color: S.gold, padding: "6px 10px", borderRadius: 8, fontSize: 12.5, userSelect: "all" }}>{topic}</code>
        <a href={`${base}/${topic}`} target="_blank" rel="noreferrer" className="md-body"
          style={{ background: S.red, color: "#fff", padding: "7px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
          Open in browser
        </a>
        <button onClick={dismiss} className="md-body" style={{ background: "none", border: "none", color: S.dim, fontSize: 12.5, cursor: "pointer", marginLeft: "auto" }}>
          Got it
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [gameId, setGameId] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("game"); } catch { return null; }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const openGame = (id) => {
    setGameId(id);
    try { window.history.replaceState(null, "", id ? `/?game=${id}` : "/"); } catch {}
  };

  if (session === undefined) return <Frame><p style={{ color: S.dim, marginTop: "30vh", textAlign: "center" }}>Loading…</p></Frame>;
  if (!session) return <Login />;
  if (gameId) return <GameScreen session={session} gameId={gameId} onBack={() => openGame(null)} />;
  return <GameList session={session} onOpen={openGame} />;
}
