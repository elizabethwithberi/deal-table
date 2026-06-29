// Table.jsx — the game table, rendering a redacted server view.
// Props: view (getPlayerView output), onSubmit(action) -> Promise<errorString|null>
import { useState, useEffect } from "react";
import { COLORS, HEX, BUILDABLE, S, fontCss, val, isComplete, rentFor, assets } from "./gameMeta.js";

const HAND_LIMIT = 7;
const cname = (c) => COLORS[c].name;

function Chip({ value, selected, onClick }) {
  return (
    <button onClick={onClick} disabled={!onClick} className="md-mono" style={{
      minWidth: 44, height: 44, borderRadius: 22, fontWeight: 700, fontSize: 14,
      background: selected ? S.gold : S.stock, color: S.ink,
      border: selected ? "3px solid #fff" : `3px dashed ${S.dim}`,
      cursor: onClick ? "pointer" : "default", padding: "0 8px",
      boxShadow: "0 2px 0 rgba(0,0,0,0.35)",
    }}>${value}M</button>
  );
}

function PropSet({ color, g, player, onCardTap, selectedIds, forceExpand }) {
  const [open, setOpen] = useState(false);
  const complete = isComplete(player, color);
  const info = COLORS[color];
  const heldTier = Math.min(g.cards.length, info.setSize);
  const currentRent = rentFor(player, color);
  const expanded = open || forceExpand;

  return (
    <div style={{
      border: complete ? `2px solid ${S.gold}` : `1px solid ${S.line}`,
      borderRadius: 9, background: S.panelLite, overflow: "hidden",
      flex: expanded ? "1 1 100%" : "0 0 auto",
    }}>
      {/* Compact header — always visible, tap to expand (unless forced) */}
      <button
        onClick={forceExpand ? undefined : () => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          padding: "5px 8px", cursor: forceExpand ? "default" : "pointer",
          background: "transparent", border: "none", textAlign: "left",
        }}
      >
        {/* mini stacked swatches showing how many cards */}
        <span style={{ display: "flex", flexShrink: 0 }}>
          {g.cards.map((c, i) => (
            <span key={c.id} style={{
              width: 9, height: 18, borderRadius: 2, marginLeft: i === 0 ? 0 : -3,
              background: c.kind === "WILDCARD"
                ? `repeating-linear-gradient(45deg, ${HEX[color]}, ${HEX[color]} 3px, #fff 3px, #fff 5px)`
                : HEX[color],
              border: "1px solid rgba(0,0,0,0.35)",
            }} />
          ))}
        </span>
        <span className="md-body" style={{ fontSize: 11, fontWeight: 700, color: complete ? S.gold : S.stock, whiteSpace: "nowrap" }}>
          {cname(color)}
        </span>
        <span className="md-mono" style={{ fontSize: 10, color: S.dim, whiteSpace: "nowrap" }}>
          {g.cards.length}/{info.setSize}
        </span>
        <span className="md-mono" style={{ fontSize: 10, color: S.gold, whiteSpace: "nowrap", marginLeft: "auto" }}>
          ${currentRent}M{g.buildings.length ? "+" : ""}
        </span>
        {!forceExpand && (
          <span style={{ fontSize: 9, color: S.dim, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
        )}
      </button>

      {/* Expanded detail: rent ladder + each card with name & value */}
      {expanded && (
        <div style={{ padding: "0 8px 7px" }}>
          <div className="md-mono" style={{ display: "flex", gap: 3, marginBottom: 6, alignItems: "center" }}>
            <span className="md-body" style={{ fontSize: 9, color: S.dim, marginRight: 2 }}>RENT</span>
            {info.rent.map((r, i) => {
              const isHeld = i + 1 === heldTier && g.cards.length > 0;
              return (
                <span key={i} style={{
                  fontSize: 11, fontWeight: 700,
                  color: isHeld ? S.ink : S.dim,
                  background: isHeld ? S.gold : "transparent",
                  borderRadius: 4, padding: isHeld ? "1px 5px" : "1px 2px",
                }}>{r}</span>
              );
            })}
            {g.buildings.length > 0 && (
              <span style={{ fontSize: 10, color: S.gold, marginLeft: 2 }}>
                +{g.buildings.map((b) => (b.type === "HOUSE" ? "H" : "★")).join("")}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {g.cards.map((c) => {
              const sel = selectedIds.has(c.id);
              return (
                <button key={c.id} onClick={onCardTap ? () => onCardTap(c, color, false) : undefined} style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left",
                  borderRadius: 5, padding: "3px 5px", cursor: onCardTap ? "pointer" : "default",
                  background: sel ? S.gold : "rgba(0,0,0,0.18)",
                  border: sel ? "2px solid #fff" : "1px solid rgba(255,255,255,0.08)",
                }}>
                  <span style={{
                    flexShrink: 0, width: 12, height: 16, borderRadius: 2,
                    background: c.kind === "WILDCARD"
                      ? `repeating-linear-gradient(45deg, ${HEX[color]}, ${HEX[color]} 4px, #fff 4px, #fff 6px)`
                      : HEX[color],
                    border: "1px solid rgba(255,255,255,0.3)",
                  }} />
                  <span className="md-body" style={{ flex: 1, fontSize: 10.5, fontWeight: 600, color: sel ? S.ink : S.stock, lineHeight: 1.1 }}>{c.name}</span>
                  <span className="md-mono" style={{ fontSize: 10, color: sel ? S.ink : S.dim }}>${val(c)}M</span>
                </button>
              );
            })}
            {g.buildings.map((b) => {
              const sel = selectedIds.has(b.id);
              return (
                <button key={b.id} onClick={onCardTap ? () => onCardTap(b, color, true) : undefined} style={{
                  display: "flex", alignItems: "center", gap: 6, width: "100%", textAlign: "left",
                  borderRadius: 5, padding: "3px 5px", cursor: onCardTap ? "pointer" : "default",
                  background: sel ? S.gold : "rgba(232,195,46,0.15)",
                  border: sel ? "2px solid #fff" : "1px solid rgba(232,195,46,0.3)",
                }}>
                  <span className="md-mono" style={{ flexShrink: 0, width: 12, textAlign: "center", fontSize: 11, fontWeight: 700, color: S.gold }}>{b.type === "HOUSE" ? "H" : "★"}</span>
                  <span className="md-body" style={{ flex: 1, fontSize: 10.5, fontWeight: 600, color: sel ? S.ink : S.stock }}>{b.name}</span>
                  <span className="md-mono" style={{ fontSize: 10, color: sel ? S.ink : S.dim }}>${val(b)}M</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PropChipRow({ player, onCardTap, selectedIds = new Set(), forceExpand = false }) {
  const colors = Object.keys(player.properties);
  if (colors.length === 0)
    return <div className="md-body" style={{ color: S.dim, fontSize: 13, padding: "6px 0" }}>No properties yet</div>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {colors.map((color) => (
        <PropSet
          key={color}
          color={color}
          g={player.properties[color]}
          player={player}
          onCardTap={onCardTap}
          selectedIds={selectedIds}
          forceExpand={forceExpand}
        />
      ))}
    </div>
  );
}

// Renders a player's bank as individual denomination chips (read-only).
function BankChips({ bank }) {
  if (!bank || bank.length === 0) return null;
  // group identical values for compactness: "3×$1M  1×$5M"
  const counts = {};
  for (const c of bank) counts[val(c)] = (counts[val(c)] || 0) + 1;
  const order = Object.keys(counts).map(Number).sort((a, b) => a - b);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
      {order.map((v) => (
        <span key={v} className="md-mono" style={{
          fontSize: 10, fontWeight: 700, color: S.ink, background: S.stock,
          borderRadius: 10, padding: "1px 7px",
        }}>{counts[v]}×${v}M</span>
      ))}
    </div>
  );
}

function HandCard({ card, onClick }) {
  const band =
    card.kind === "PROPERTY" ? (HEX[card.color] || S.dim) :
    card.kind === "WILDCARD" ? (card.colors === "ANY" ? "linear-gradient(90deg,#D33A2C,#E8862E,#E8C32E,#1E8A4C,#2A4B9B,#C95C9B)" : `linear-gradient(90deg, ${HEX[card.colors[0]] || S.dim} 50%, ${HEX[card.colors[1]] || S.dim} 50%)`) :
    card.kind === "RENT" ? (card.colors === "ANY" ? "linear-gradient(90deg,#1E8A4C,#2A4B9B,#D33A2C)" : `linear-gradient(90deg, ${HEX[card.colors[0]] || S.dim} 50%, ${HEX[card.colors[1]] || S.dim} 50%)`) :
    card.kind === "MONEY" ? S.gold : S.red;
  const label = card.kind === "ACTION" ? "ACTION" : card.kind === "RENT" ? "RENT" : "";
  // Outer element is a div (not a button): Safari mis-handles display:flex
  // column layout on <button>, which was collapsing the color band. A div
  // with explicit block children renders identically in Safari and Chrome.
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
      style={{
        flexShrink: 0, width: 66, height: 94, borderRadius: 8, background: S.stock,
        border: "1px solid rgba(0,0,0,0.25)", boxShadow: "0 2px 0 rgba(0,0,0,0.4)",
        overflow: "hidden", cursor: "pointer", textAlign: "left", boxSizing: "border-box",
      }}
    >
      {/* Band: a plain block with explicit height + line-height so it can't collapse */}
      <div style={{
        height: 18, width: "100%", background: band, boxSizing: "border-box",
        color: "#fff", fontSize: 7, fontWeight: 700, letterSpacing: 0.5,
        lineHeight: "18px", textAlign: "center",
      }} className="md-body">
        {label}
      </div>
      <div style={{ height: 76, boxSizing: "border-box", padding: "4px 5px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="md-body" style={{ fontSize: 9.5, fontWeight: 700, color: S.ink, lineHeight: 1.15 }}>{card.name}</div>
        <div className="md-mono" style={{ fontSize: 10, fontWeight: 700, color: "#6B6456" }}>${val(card)}M</div>
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "rgba(0,0,0,0.55)" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: S.panel, borderTop: `3px solid ${S.gold}`, borderRadius: "18px 18px 0 0", padding: "16px 16px 28px", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="md-display" style={{ color: S.stock, fontSize: 17 }}>{title}</div>
          <button onClick={onClose} className="md-body" style={{ background: "none", border: "none", color: S.dim, fontSize: 14, cursor: "pointer", padding: 6 }}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SheetBtn({ children, onClick, danger, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} className="md-body" style={{
      display: "block", width: "100%", textAlign: "left", padding: "13px 14px", marginBottom: 8,
      borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: disabled ? "default" : "pointer",
      background: danger ? S.red : S.panelLite, color: disabled ? S.dim : S.stock,
      border: `1px solid ${danger ? S.red : S.line}`, opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}

const Swatch = ({ c }) => (
  <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: HEX[c], marginRight: 10, verticalAlign: -2 }} />
);

export default function Table({ view, onSubmit }) {
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [wizard, setWizard] = useState(null);
  const [paySel, setPaySel] = useState(new Set());
  const [discardSel, setDiscardSel] = useState(new Set());
  const [discarding, setDiscarding] = useState(false);
  const [movingWild, setMovingWild] = useState(null);
  const [showLog, setShowLog] = useState(false);

  const you = view.you;
  const me = view.players[you];
  const myTurn = view.turn.playerId === you && view.pendingCount === 0 && !view.winner;
  const myResponse = view.pending.find((p) => p.type === "RESPONSE" && p.playerId === you);
  const myPayment = view.pending.find((p) => p.type === "PAYMENT" && p.playerId === you);
  const jsnInHand = me.hand.find((c) => c.type === "JUST_SAY_NO");
  const opponents = view.playerOrder.filter((p) => p !== you);

  const submit = async (action) => {
    if (busy) return false;
    setBusy(true);
    const err = await onSubmit(action);
    setBusy(false);
    setError(err);
    return !err;
  };

  // Smart auto-end: when it's your turn, you've used all 3 plays, nothing is
  // pending, and you're within the hand limit, there's nothing left to do —
  // so end the turn automatically instead of making you tap End turn.
  // (If over the hand limit, we DON'T auto-end; you must discard first.)
  useEffect(() => {
    if (
      myTurn &&
      view.turn.playsLeft === 0 &&
      view.pendingCount === 0 &&
      me.hand.length <= HAND_LIMIT &&
      !busy &&
      !wizard
    ) {
      const t = setTimeout(() => submit({ type: "END_TURN" }), 700);
      return () => clearTimeout(t);
    }
  }, [myTurn, view.turn.playsLeft, view.pendingCount, me.hand.length, busy, wizard]);

  const paySelTotal = [...paySel].reduce((t, id) => {
    const inBank = me.bank.find((c) => c.id === id);
    if (inBank) return t + val(inBank);
    for (const g of Object.values(me.properties)) {
      const c = g.cards.find((x) => x.id === id) || g.buildings.find((x) => x.id === id);
      if (c) return t + val(c);
    }
    return t;
  }, 0);
  const togglePay = (id) => setPaySel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const startWizard = (card) => setWizard({ card, color: null, targetPlayerId: null, targetCardId: null, doublers: new Set() });
  const finishWizard = async (extra = {}) => {
    const ok = await submit({ type: "PLAY_CARD", cardId: wizard.card.id, ...extra });
    if (ok) setWizard(null);
  };

  const wizardBody = () => {
    const w = wizard, c = w.card;
    if (!w.step) {
      const opts = [];
      if (c.kind === "MONEY") opts.push([`Bank it ($${val(c)}M)`, () => finishWizard({ mode: "MONEY" })]);
      if (c.kind === "PROPERTY") opts.push(["Put it on the table", () => finishWizard({ mode: "PROPERTY" })]);
      if (c.kind === "WILDCARD") opts.push(["Play as a property", () => setWizard({ ...w, step: "WILD_COLOR" })]);
      if (c.kind === "ACTION" || c.kind === "RENT") {
        const label = {
          PASS_GO: "Play it: draw 2 cards", HOUSE: "Build on a complete set", HOTEL: "Build on a complete set",
          DEBT_COLLECTOR: "Collect $5M from someone", BIRTHDAY: "Everyone pays you $2M",
          SLY_DEAL: "Steal a property", FORCED_DEAL: "Force a property trade", DEAL_BREAKER: "Steal a complete set",
        }[c.type] || (c.kind === "RENT" ? "Charge rent" : null);
        if (label) opts.push([label, () => {
          if (c.type === "PASS_GO" || c.type === "BIRTHDAY") finishWizard({ mode: "ACTION" });
          else if (c.type === "HOUSE" || c.type === "HOTEL") setWizard({ ...w, step: "BUILD_COLOR" });
          else if (c.kind === "RENT") setWizard({ ...w, step: "RENT_COLOR" });
          else setWizard({ ...w, step: "PICK_PLAYER" });
        }]);
        opts.push([`Bank it as money ($${val(c)}M)`, () => finishWizard({ mode: "MONEY" })]);
      }
      return <>{opts.map(([label, fn], i) => <SheetBtn key={i} onClick={fn}>{label}</SheetBtn>)}</>;
    }
    if (w.step === "WILD_COLOR") {
      const colors = c.colors === "ANY" ? Object.keys(COLORS) : c.colors;
      return colors.map((col) => (
        <SheetBtn key={col} onClick={() => finishWizard({ mode: "PROPERTY", color: col })}><Swatch c={col} />{cname(col)}</SheetBtn>
      ));
    }
    if (w.step === "BUILD_COLOR") {
      const eligible = BUILDABLE.filter((col) => isComplete(me, col));
      if (!eligible.length) return <p className="md-body" style={{ color: S.dim }}>You need a complete colored set first (railroads and utilities can't be built on).</p>;
      return eligible.map((col) => (
        <SheetBtn key={col} onClick={() => finishWizard({ mode: "ACTION", color: col })}><Swatch c={col} />{cname(col)} set</SheetBtn>
      ));
    }
    if (w.step === "PICK_PLAYER") {
      return opponents.map((pid) => (
        <SheetBtn key={pid} onClick={() => {
          if (c.type === "DEBT_COLLECTOR") finishWizard({ mode: "ACTION", targetPlayerId: pid });
          else if (c.type === "DEAL_BREAKER") setWizard({ ...w, targetPlayerId: pid, step: "PICK_SET" });
          else setWizard({ ...w, targetPlayerId: pid, step: "PICK_THEIR_PROP" });
        }}>{pid}</SheetBtn>
      ));
    }
    if (w.step === "PICK_SET") {
      const t = view.players[w.targetPlayerId];
      const sets = Object.keys(t.properties).filter((col) => isComplete(t, col));
      if (!sets.length) return <p className="md-body" style={{ color: S.dim }}>{w.targetPlayerId} has no complete sets to steal.</p>;
      return sets.map((col) => (
        <SheetBtn key={col} danger onClick={() => finishWizard({ mode: "ACTION", targetPlayerId: w.targetPlayerId, targetSetColor: col })}>
          Steal the {cname(col)} set ({t.properties[col].cards.length} cards)
        </SheetBtn>
      ));
    }
    if (w.step === "PICK_THEIR_PROP") {
      const t = view.players[w.targetPlayerId];
      const options = [];
      for (const col of Object.keys(t.properties)) {
        if (isComplete(t, col)) continue;
        for (const pc of t.properties[col].cards) options.push({ pc, col });
      }
      if (!options.length) return <p className="md-body" style={{ color: S.dim }}>{w.targetPlayerId} has no stealable properties (complete sets are protected).</p>;
      return options.map(({ pc, col }) => (
        <SheetBtn key={pc.id} onClick={() => {
          if (c.type === "SLY_DEAL") finishWizard({ mode: "ACTION", targetPlayerId: w.targetPlayerId, targetCardId: pc.id });
          else setWizard({ ...w, targetCardId: pc.id, step: "PICK_MY_PROP" });
        }}><Swatch c={col} />{pc.name}</SheetBtn>
      ));
    }
    if (w.step === "PICK_MY_PROP") {
      const options = [];
      for (const col of Object.keys(me.properties)) for (const pc of me.properties[col].cards) options.push({ pc, col });
      if (!options.length) return <p className="md-body" style={{ color: S.dim }}>You need a property of your own to trade away.</p>;
      return options.map(({ pc, col }) => (
        <SheetBtn key={pc.id} onClick={() => finishWizard({ mode: "ACTION", targetPlayerId: w.targetPlayerId, targetCardId: w.targetCardId, myCardId: pc.id })}>
          Give up: <Swatch c={col} />{pc.name}
        </SheetBtn>
      ));
    }
    if (w.step === "RENT_COLOR") {
      const myColors = Object.keys(me.properties).filter((col) => me.properties[col].cards.length > 0);
      const eligible = c.colors === "ANY" ? myColors : myColors.filter((col) => c.colors.includes(col));
      if (!eligible.length) return <p className="md-body" style={{ color: S.dim }}>You don't own a property this rent card covers.</p>;
      return eligible.map((col) => (
        <SheetBtn key={col} onClick={() => setWizard({ ...w, color: col, step: "RENT_EXTRAS" })}>
          <Swatch c={col} />{cname(col)} — base rent ${rentFor(me, col)}M
        </SheetBtn>
      ));
    }
    if (w.step === "RENT_EXTRAS") {
      const dblCards = me.hand.filter((x) => x.type === "DOUBLE_RENT");
      const nDbl = w.doublers.size;
      const amount = rentFor(me, w.color, nDbl);
      const playsNeeded = 1 + nDbl;
      return (
        <>
          {dblCards.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div className="md-body" style={{ color: S.dim, fontSize: 13, marginBottom: 8 }}>Add Double the Rent? (each costs 1 extra play)</div>
              {dblCards.map((d) => (
                <SheetBtn key={d.id} onClick={() => {
                  const n = new Set(w.doublers); n.has(d.id) ? n.delete(d.id) : n.add(d.id);
                  setWizard({ ...w, doublers: n });
                }}>{w.doublers.has(d.id) ? "✓ " : ""}Double the Rent</SheetBtn>
              ))}
            </div>
          )}
          <div className="md-display" style={{ color: S.gold, fontSize: 22, marginBottom: 12 }}>
            ${amount}M <span className="md-body" style={{ color: S.dim, fontSize: 13, fontWeight: 400 }}>· uses {playsNeeded} of {view.turn.playsLeft} plays</span>
          </div>
          {c.colors === "ANY"
            ? opponents.map((pid) => (
                <SheetBtn key={pid} danger onClick={() => finishWizard({ mode: "ACTION", color: w.color, targetPlayerId: pid, withDoubleRent: [...w.doublers] })}>
                  Charge {pid}
                </SheetBtn>
              ))
            : <SheetBtn danger onClick={() => finishWizard({ mode: "ACTION", color: w.color, withDoubleRent: [...w.doublers] })}>Charge everyone ${amount}M</SheetBtn>}
        </>
      );
    }
    return null;
  };

  return (
    <div className="md-body" style={{ minHeight: "100vh", background: S.table, paddingBottom: 132 }}>
      <style>{fontCss}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${S.line}` }}>
        <div className="md-display" style={{ color: S.stock, fontSize: 16 }}>DEAL TABLE</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="md-mono" style={{ color: S.dim, fontSize: 12 }}>deck {view.deckCount}</span>
          <button onClick={() => setShowLog(true)} className="md-body" style={{ background: S.panel, color: S.dim, border: `1px solid ${S.line}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer" }}>Log</button>
        </div>
      </div>

      <div style={{ padding: "0 14px" }}>
        {view.winner && (
          <div style={{ background: S.gold, borderRadius: 14, padding: "18px 16px", margin: "12px 0 14px", boxShadow: "0 4px 0 #A8890F" }}>
            <div className="md-display" style={{ color: S.ink, fontSize: 22 }}>🏆 {view.winner} WINS</div>
            <div style={{ color: "#5A4D14", fontSize: 14, marginTop: 2 }}>Three complete sets. Game over.</div>
          </div>
        )}

        {!view.winner && (
          <div style={{
            background: myTurn || myResponse || myPayment ? S.red : S.panel,
            borderRadius: 14, padding: "13px 16px", margin: "12px 0 14px",
            boxShadow: myTurn || myResponse || myPayment ? "0 4px 0 #9C2E20" : "none",
            transform: myResponse || myPayment ? "rotate(-0.6deg)" : "none",
          }}>
            {myResponse ? (
              <>
                <div className="md-display" style={{ color: "#fff", fontSize: 16, marginBottom: 4 }}>
                  {myResponse.jsnDepth % 2 === 1 ? "They said NO to you" : "You're under attack"}
                </div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13.5, marginBottom: 12 }}>{myResponse.ctx.description}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button disabled={busy} onClick={() => submit({ type: "RESPOND", pendingId: myResponse.id, response: "ACCEPT" })}
                    className="md-body" style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: S.stock, color: S.ink, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    {myResponse.jsnDepth % 2 === 1 ? "Back down" : "Accept it"}
                  </button>
                  <button disabled={!jsnInHand || busy}
                    onClick={() => jsnInHand && submit({ type: "RESPOND", pendingId: myResponse.id, response: "JUST_SAY_NO", cardId: jsnInHand.id })}
                    className="md-display" style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "2px solid #fff", background: "transparent", color: "#fff", fontSize: 13, letterSpacing: 1, cursor: jsnInHand ? "pointer" : "default", opacity: jsnInHand ? 1 : 0.4 }}>
                    JUST SAY NO
                  </button>
                </div>
              </>
            ) : myPayment ? (
              <>
                <div className="md-display" style={{ color: "#fff", fontSize: 16 }}>Pay {myPayment.creditorId} ${myPayment.amount}M</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 }}>
                  Tap money and properties below. Selected: <b className="md-mono">${paySelTotal}M</b>. No change given.
                </div>
                <button
                  disabled={busy || (paySelTotal < myPayment.amount && paySelTotal < assets(me))}
                  onClick={async () => { if (await submit({ type: "PAY", pendingId: myPayment.id, cardIds: [...paySel] })) setPaySel(new Set()); }}
                  className="md-display"
                  style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 10, border: "none", background: S.stock, color: S.ink, fontSize: 15, letterSpacing: 1, cursor: "pointer", opacity: paySelTotal >= myPayment.amount || paySelTotal >= assets(me) ? 1 : 0.45 }}
                >HAND IT OVER</button>
              </>
            ) : myTurn ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div className="md-display" style={{ color: "#fff", fontSize: 16 }}>Your turn</div>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                    {view.turn.playsLeft === 0
                      ? (me.hand.length > HAND_LIMIT ? `Discard down to ${HAND_LIMIT} to end your turn` : "No plays left · ending turn…")
                      : `${view.turn.playsLeft} play${view.turn.playsLeft === 1 ? "" : "s"} left · tap a card to play it`}
                  </div>
                </div>
                <button disabled={busy} onClick={() => {
                  if (me.hand.length > HAND_LIMIT) { setDiscarding(true); setError(`Over the hand limit — pick ${me.hand.length - HAND_LIMIT} to discard.`); }
                  else submit({ type: "END_TURN" });
                }}
                  className="md-body" style={{ padding: "10px 16px", borderRadius: 10, border: "2px solid #fff", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                  End turn
                </button>
              </div>
            ) : (
              <div style={{ color: S.dim, fontSize: 14 }}>
                {view.pendingCount > 0
                  ? `Waiting on ${view.waitingOn.join(", ")}…`
                  : <>It's <b style={{ color: S.stock }}>{view.turn.playerId}</b>'s turn.</>}
              </div>
            )}
          </div>
        )}

        {opponents.map((pid) => {
          const p = view.players[pid];
          return (
            <div key={pid} style={{ background: S.panel, borderRadius: 12, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div className="md-body" style={{ color: S.stock, fontWeight: 700, fontSize: 14 }}>
                  {pid} {view.turn.playerId === pid && !view.winner ? <span style={{ color: S.gold, fontSize: 11 }}>· playing</span> : ""}
                </div>
                <div className="md-mono" style={{ color: S.dim, fontSize: 12 }}>
                  {p.handCount} in hand · <span style={{ color: S.gold }}>${p.bankTotal}M</span> bank · {p.completeSets}/3 sets
                </div>
              </div>
              <PropChipRow player={p} />
              {p.bank && p.bank.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="md-body" style={{ color: S.dim, fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 2 }}>Bank</div>
                  <BankChips bank={p.bank} />
                </div>
              )}
            </div>
          );
        })}

        <div style={{ background: S.panel, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${S.line}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <div className="md-body" style={{ color: S.stock, fontWeight: 700, fontSize: 14 }}>Your table</div>
            <div className="md-mono" style={{ color: S.dim, fontSize: 12 }}>{me.completeSets}/3 sets</div>
          </div>
          <PropChipRow
            player={me}
            selectedIds={paySel}
            forceExpand={!!myPayment}
            onCardTap={(card, color, isBuilding) => {
              if (myPayment) { togglePay(card.id); return; }
              if (myTurn && card.kind === "WILDCARD" && !isBuilding) setMovingWild({ card, from: color });
            }}
          />
          <div style={{ marginTop: 10 }}>
            <div className="md-body" style={{ color: S.dim, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              Bank · <span className="md-mono" style={{ color: S.gold }}>${me.bankTotal}M</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {me.bank.length === 0 && <span style={{ color: S.dim, fontSize: 13 }}>Empty — bank some money so rent doesn't cost you properties.</span>}
              {me.bank.map((c) => (
                <Chip key={c.id} value={val(c)} selected={paySel.has(c.id)} onClick={myPayment ? () => togglePay(c.id) : undefined} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `linear-gradient(transparent, ${S.table} 18px)`, paddingTop: 22 }}>
        <div style={{ background: S.panel, borderTop: `1px solid ${S.line}`, padding: "10px 0 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0 14px 8px", alignItems: "center" }}>
            <span className="md-body" style={{ color: S.dim, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
              YOUR HAND · {me.hand.length}{me.hand.length > HAND_LIMIT ? ` (over limit of ${HAND_LIMIT})` : ""}
            </span>
            {discarding && (
              <button
                disabled={busy || discardSel.size !== me.hand.length - HAND_LIMIT}
                onClick={async () => { if (await submit({ type: "DISCARD", cardIds: [...discardSel] })) { setDiscarding(false); setDiscardSel(new Set()); } }}
                className="md-body" style={{ background: S.red, border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: discardSel.size === me.hand.length - HAND_LIMIT ? 1 : 0.5 }}>
                Discard {discardSel.size}/{me.hand.length - HAND_LIMIT}
              </button>
            )}
          </div>
          <div className="md-scroll" style={{ display: "flex", gap: 7, overflowX: "auto", padding: "0 14px 4px" }}>
            {me.hand.map((c) => (
              <div key={c.id} style={{ position: "relative", outline: discardSel.has(c.id) ? `3px solid ${S.red}` : "none", borderRadius: 10, flexShrink: 0 }}>
                <HandCard card={c} onClick={() => {
                  if (discarding) { setDiscardSel((s) => { const n = new Set(s); n.has(c.id) ? n.delete(c.id) : n.add(c.id); return n; }); return; }
                  if (myTurn) startWizard(c);
                  else setError(myResponse || myPayment ? "Resolve the action above first." : "Not your turn — but you can look.");
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div onClick={() => setError(null)} className="md-body" style={{ position: "fixed", bottom: 150, left: 14, right: 14, zIndex: 60, background: S.ink, border: `2px solid ${S.red}`, color: S.stock, borderRadius: 10, padding: "11px 14px", fontSize: 13.5, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
          {error} <span style={{ color: S.dim }}>· tap to dismiss</span>
        </div>
      )}

      {wizard && <Sheet title={wizard.card.name} onClose={() => setWizard(null)}>{wizardBody()}</Sheet>}
      {movingWild && (
        <Sheet title="Move wildcard (free)" onClose={() => setMovingWild(null)}>
          {(movingWild.card.colors === "ANY" ? Object.keys(COLORS) : movingWild.card.colors)
            .filter((c) => c !== movingWild.from)
            .map((col) => (
              <SheetBtn key={col} onClick={async () => { if (await submit({ type: "MOVE_WILDCARD", cardId: movingWild.card.id, toColor: col })) setMovingWild(null); }}>
                <Swatch c={col} />Move to {cname(col)}
              </SheetBtn>
            ))}
        </Sheet>
      )}
      {showLog && (
        <Sheet title="Table talk" onClose={() => setShowLog(false)}>
          {[...view.log].reverse().map((e, i) => (
            <div key={i} className="md-body" style={{ color: i === 0 ? S.stock : S.dim, fontSize: 13.5, padding: "7px 0", borderBottom: `1px solid ${S.line}` }}>{e.msg}</div>
          ))}
        </Sheet>
      )}
    </div>
  );
}
